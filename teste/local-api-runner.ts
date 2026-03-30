/**
 * Testes manuais / smoke da API (HTTP real).
 * Pré-requisito: servidor acessível em TEST_BASE_URL (ex.: npm run start:dev ou Docker).
 *
 * Variáveis opcionais:
 *   TEST_BASE_URL, TEST_TENANT_SLUG, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3006";
const TENANT_SLUG = process.env.TEST_TENANT_SLUG ?? "clinica-exemplo";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@clinica.local";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "DevAdmin123!";

type ReportRow = {
  step: string;
  method: string;
  path: string;
  status: number;
  expected: string;
  ok: boolean;
  ms: number;
  detail?: string;
};

function unwrapPayload(json: unknown): unknown {
  if (json && typeof json === "object" && "message" in json) {
    const m = (json as { message: unknown }).message;
    if (m && typeof m === "object" && m !== null && "message" in m) {
      return (m as { message: unknown }).message;
    }
  }
  return json;
}

async function http(
  method: string,
  pathname: string,
  options: {
    token?: string;
    body?: unknown;
    query?: Record<string, string | undefined>;
    extraHeaders?: Record<string, string>;
  } = {},
): Promise<{ status: number; json: unknown; raw: string }> {
  const url = new URL(pathname, BASE);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.extraHeaders) {
    Object.assign(headers, options.extraHeaders);
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const raw = await res.text();
  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { parseError: true, raw: raw.slice(0, 400) };
  }
  return { status: res.status, json, raw };
}

function expects(
  status: number,
  allowed: number | readonly number[],
): boolean {
  const a = Array.isArray(allowed) ? allowed : [allowed];
  return a.includes(status);
}

async function main() {
  const rows: ReportRow[] = [];
  const ts = Date.now();
  const run = async (
    step: string,
    method: string,
    path: string,
    opt: {
      token?: string;
      body?: unknown;
      query?: Record<string, string | undefined>;
      extraHeaders?: Record<string, string>;
      allow?: number | readonly number[];
      note?: string;
    } = {},
  ): Promise<{ ok: boolean; payload: unknown; status: number }> => {
    const allow = opt.allow ?? [200, 201];
    const t0 = Date.now();
    const { status, json } = await http(method, path, {
      token: opt.token,
      body: opt.body,
      query: opt.query,
      extraHeaders: opt.extraHeaders,
    });
    const ms = Date.now() - t0;
    const ok = expects(status, allow);
    let detail: string | undefined;
    if (!ok) {
      detail = JSON.stringify(json).slice(0, 800);
    } else if (opt.note) {
      detail = opt.note;
    }
    rows.push({
      step,
      method,
      path,
      status,
      expected: Array.isArray(allow) ? allow.join("|") : String(allow),
      ok,
      ms,
      detail,
    });
    return { ok, payload: unwrapPayload(json), status };
  };

  let token = "";
  let tenantId = "";
  let adminUserId = "";

  // --- Público
  await run("Raiz GET /", "GET", "/", { allow: [200] });
  await run("Tenant por slug (público)", "GET", `/tenants/${TENANT_SLUG}`, {
    allow: [200],
  });

  // --- Login
  const login = await run("Login admin", "POST", "/auth/login", {
    body: {
      tenantSlug: TENANT_SLUG,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    allow: [200],
  });
  if (!login.ok || !login.payload || typeof login.payload !== "object") {
    await writeReports(rows, ts, false);
    process.exitCode = 1;
    return;
  }
  const lp = login.payload as { token?: string; user?: { tenantId?: string; id?: string } };
  token = lp.token ?? "";
  tenantId = lp.user?.tenantId ?? "";
  adminUserId = lp.user?.id ?? "";
  if (!token || !tenantId) {
    rows.push({
      step: "Abortar",
      method: "-",
      path: "-",
      status: 0,
      expected: "token+tenantId",
      ok: false,
      ms: 0,
      detail: "Resposta de login sem token ou tenantId",
    });
    await writeReports(rows, ts, false);
    process.exitCode = 1;
    return;
  }

  // --- Tenant API (POST exige JWT; grava created_by_user_id)
  await run("POST criar tenant (autenticado)", "POST", "/api/tenants", {
    token,
    body: {
      name: `E2E Inst ${ts}`,
      slug: `e2e-inst-${ts}`,
      legalName: null,
      isActive: true,
    },
    allow: [201],
  });

  await run("GET listar tenant atual", "GET", "/api/tenants", {
    token,
    allow: [200],
  });

  await run("GET tenant por id (jwt)", "GET", `/api/tenants/${tenantId}`, {
    token,
    allow: [200],
  });

  await run("PUT atualizar tenant", "PUT", `/api/tenants/${tenantId}`, {
    token,
    body: { name: `Clínica E2E ${ts}` },
    allow: [200],
  });

  // --- Signup (autenticado)
  const signupEmail = `e2e-signup-${ts}@test.local`;
  await run("POST signup (admin cria usuário)", "POST", "/auth/signup", {
    token,
    body: {
      tenantSlug: TENANT_SLUG,
      fullName: "Usuário E2E Signup",
      email: signupEmail,
      password: "SenhaE2E_9",
    },
    allow: [201],
  });

  // --- Users
  await run("GET listar users", "GET", "/api/users", { token, allow: [200] });

  const newUserEmail = `e2e-user-${ts}@test.local`;
  const createUser = await run("POST criar user", "POST", "/api/users", {
    token,
    body: {
      email: newUserEmail,
      password: "SenhaE2E_9",
      fullName: "Staff E2E",
    },
    allow: [201],
  });
  const newUserId =
    createUser.ok &&
    createUser.payload &&
    typeof createUser.payload === "object" &&
    "id" in createUser.payload
      ? String((createUser.payload as { id: string }).id)
      : "";

  if (newUserId) {
    await run("GET user por id", "GET", `/api/users/${newUserId}`, {
      token,
      allow: [200],
    });
    await run("PUT atualizar user", "PUT", `/api/users/${newUserId}`, {
      token,
      body: { fullName: "Staff E2E atualizado" },
      allow: [200],
    });
    await run("DELETE desativar user", "DELETE", `/api/users/${newUserId}`, {
      token,
      allow: [200],
    });
  }

  // --- Patients
  await run("GET listar patients", "GET", "/api/patients", {
    token,
    allow: [200],
  });

  const createPatient = await run("POST criar patient", "POST", "/api/patients", {
    token,
    body: {
      fullName: `Paciente E2E ${ts}`,
      internalCode: `e2e-${ts}`,
      email: "",
    },
    allow: [201],
  });
  const patientId =
    createPatient.ok &&
    createPatient.payload &&
    typeof createPatient.payload === "object" &&
    "id" in createPatient.payload
      ? String((createPatient.payload as { id: string }).id)
      : "";

  if (patientId) {
    await run("GET patient por id", "GET", `/api/patients/${patientId}`, {
      token,
      allow: [200],
    });
    await run("PUT atualizar patient", "PUT", `/api/patients/${patientId}`, {
      token,
      body: { city: "São Paulo" },
      allow: [200],
    });
  }

  // --- Consultations (precisa patientId)
  await run("GET listar consultations", "GET", "/api/consultations", {
    token,
    allow: [200],
  });

  let consultationId = "";
  if (patientId) {
    const c = await run("POST criar consultation", "POST", "/api/consultations", {
      token,
      body: {
        patientId,
        practitionerId: adminUserId || null,
        status: "scheduled",
        chiefComplaint: "E2E",
      },
      allow: [201],
    });
    if (
      c.ok &&
      c.payload &&
      typeof c.payload === "object" &&
      "id" in c.payload
    ) {
      consultationId = String((c.payload as { id: string }).id);
    }
    if (consultationId) {
      await run("GET consultation por id", "GET", `/api/consultations/${consultationId}`, {
        token,
        allow: [200],
      });
      await run(
        "PUT atualizar consultation",
        "PUT",
        `/api/consultations/${consultationId}`,
        {
          token,
          body: { status: "completed", notes: "E2E ok" },
          allow: [200],
        },
      );
    }
  }

  // --- Medical records
  await run("GET listar medical-records", "GET", "/api/medical-records", {
    token,
    allow: [200],
  });

  let medicalRecordId = "";
  if (patientId) {
    const listMrFirst = await run("GET medical-records (antes de criar)", "GET", "/api/medical-records", {
      token,
      allow: [200],
    });
    if (listMrFirst.ok && Array.isArray(listMrFirst.payload)) {
      const found = listMrFirst.payload.find(
        (x: unknown) =>
          x &&
          typeof x === "object" &&
          (x as { patientId: string }).patientId === patientId,
      );
      if (found && typeof found === "object" && "id" in found) {
        medicalRecordId = String((found as { id: string }).id);
      }
    }
    if (!medicalRecordId) {
      const mr = await run("POST criar medical-record", "POST", "/api/medical-records", {
        token,
        body: {
          patientId,
          bloodType: "O+",
          allergies: null,
          chronicConditions: null,
        },
        allow: [201],
      });
      if (
        mr.ok &&
        mr.payload &&
        typeof mr.payload === "object" &&
        "id" in mr.payload
      ) {
        medicalRecordId = String((mr.payload as { id: string }).id);
      }
    }

    if (medicalRecordId) {
      await run(
        "GET medical-record por id",
        "GET",
        `/api/medical-records/${medicalRecordId}`,
        { token, allow: [200] },
      );
      await run(
        "PUT atualizar medical-record",
        "PUT",
        `/api/medical-records/${medicalRecordId}`,
        {
          token,
          body: { allergies: "Nenhuma (E2E)" },
          allow: [200],
        },
      );
    }
  }

  // --- Medical record entries
  await run(
    "GET medical-record-entries (todos)",
    "GET",
    "/api/medical-record-entries",
    { token, allow: [200] },
  );

  let entryId = "";
  if (medicalRecordId) {
    await run(
      "GET medical-record-entries por record",
      "GET",
      "/api/medical-record-entries",
      {
        token,
        query: { medicalRecordId },
        allow: [200],
      },
    );

    const ent = await run(
      "POST criar medical-record-entry",
      "POST",
      "/api/medical-record-entries",
      {
        token,
        body: {
          medicalRecordId,
          consultationId: consultationId || null,
          entryType: "progress",
          title: "E2E",
          content: `Entrada de teste ${ts}`,
        },
        allow: [201],
      },
    );
    if (
      ent.ok &&
      ent.payload &&
      typeof ent.payload === "object" &&
      "id" in ent.payload
    ) {
      entryId = String((ent.payload as { id: string }).id);
    }

    if (entryId) {
      await run(
        "GET medical-record-entry por id",
        "GET",
        `/api/medical-record-entries/${entryId}`,
        { token, allow: [200] },
      );
      await run(
        "PUT atualizar medical-record-entry",
        "PUT",
        `/api/medical-record-entries/${entryId}`,
        {
          token,
          body: { title: "E2E atualizado" },
          allow: [200],
        },
      );
      await run(
        "DELETE medical-record-entry",
        "DELETE",
        `/api/medical-record-entries/${entryId}`,
        { token, allow: [200] },
      );
    }
  }

  // --- Limpeza consultations / MR / patient (ordem FK)
  if (consultationId) {
    await run("DELETE consultation", "DELETE", `/api/consultations/${consultationId}`, {
      token,
      allow: [200],
    });
  }
  if (medicalRecordId) {
    await run("DELETE medical-record", "DELETE", `/api/medical-records/${medicalRecordId}`, {
      token,
      allow: [200],
    });
  }
  if (patientId) {
    await run("DELETE patient (soft)", "DELETE", `/api/patients/${patientId}`, {
      token,
      allow: [200],
    });
  }

  const allOk = rows.every((r) => r.ok);
  await writeReports(rows, ts, allOk);
  process.exitCode = allOk ? 0 : 1;
}

async function writeReports(rows: ReportRow[], ts: number, allOk: boolean) {
  const dir = join(process.cwd(), "teste", "relatorio");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.filter((r) => !r.ok).length;

  const lines: string[] = [
    `# Relatório API local`,
    ``,
    `- **Data:** ${new Date().toISOString()}`,
    `- **Base:** \`${BASE}\``,
    `- **Tenant slug:** \`${TENANT_SLUG}\``,
    `- **Resultado:** ${allOk ? "OK" : "COM FALHAS"}`,
    `- **Passou:** ${passed} / **Falhou:** ${failed} / **Total passos:** ${rows.length}`,
    ``,
    `| OK | ms | Método | Caminho | HTTP | Passo |`,
    `|:--:|-----:|:-------|:--------|-----:|:------|`,
  ];

  for (const r of rows) {
    const okMark = r.ok ? "✓" : "✗";
    lines.push(
      `| ${okMark} | ${r.ms} | ${r.method} | \`${r.path}\` | ${r.status} | ${r.step} |`,
    );
    if (r.detail) {
      lines.push(`| | | | | | _${r.detail.replace(/\n/g, " ").slice(0, 200)}_ |`);
    }
  }

  lines.push(``, `---`, ``, `_Gerado por \`npm run test:locale\` → \`teste/local-api-runner.ts\`_`);

  const md = lines.join("\n");
  const fileNamed = join(dir, `relatorio-${stamp}.md`);
  const fileUltimo = join(dir, "ultimo.md");
  await writeFile(fileNamed, md, "utf8");
  await writeFile(fileUltimo, md, "utf8");
  console.log(`\nRelatório: ${fileNamed}`);
  console.log(`Cópia:     ${fileUltimo}`);
  console.log(`Resumo: ${passed} ok, ${failed} falhas\n`);
}

void main();
