/**
 * Cenário multi-tenant (HTTP real) — **apenas 2 utilizadores** na BD (além do seed):
 * 1) **Admin** (seed): faz login → cria **3 tenants** (`POST /api/tenants` com JWT) → em cada
 *    `tenantId` grava dados clínicos com header **`X-Tenant-Id`** (N pacientes, consultas, etc.).
 * 2) Admin cria **1 utilizador** normal (`POST /api/users` no tenant base).
 * 3) Esse utilizador repete: **mais 3 tenants** e o mesmo padrão de registos por `tenantId`.
 *
 * Tenant e user são independentes: o tenant guarda `created_by_user_id`; a API permite a staff
 * operar noutro tenant se for o criador; `admin` pode operar em qualquer tenant.
 *
 * Consultas usam `practitionerId: null` (evita exigir user no tenant destino).
 *
 * Pré-requisito: API em TEST_BASE_URL (ex.: npm run start:dev ou Docker).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3006";
const HOME_TENANT_SLUG = process.env.TEST_TENANT_SLUG ?? "clinica-exemplo";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@clinica.local";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "DevAdmin123!";

const RECORDS_PER_TABLE = 3;

const LOG = "[multi-tenant]";

function mtLog(phase: string, message: string, detail?: Record<string, string>) {
  const extra = detail
    ? ` ${Object.entries(detail)
        .map(([k, v]) => `${k}=${v}`)
        .join(" | ")}`
    : "";
  console.log(`${LOG} [${phase}] ${message}${extra}`);
}

function headersForTenant(tenantId: string): Record<string, string> {
  return { "X-Tenant-Id": tenantId };
}

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

function idFromPayload(payload: unknown): string {
  if (payload && typeof payload === "object" && "id" in payload) {
    const v = (payload as { id: unknown }).id;
    return typeof v === "string" ? v : "";
  }
  return "";
}

function authFromLoginPayload(payload: unknown): {
  token: string;
  userId: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const token = typeof p.token === "string" ? p.token : "";
  const user = p.user;
  if (!user || typeof user !== "object") return null;
  const userId =
    "id" in user && typeof (user as { id: unknown }).id === "string"
      ? (user as { id: string }).id
      : "";
  if (!token || !userId) return null;
  return { token, userId };
}

async function main() {
  const rows: ReportRow[] = [];
  const ts = Date.now();

  mtLog("início", `Cenário a correr`, {
    base: BASE,
    tenantBase: HOME_TENANT_SLUG,
    ts: String(ts),
    registosPorTenant: String(RECORDS_PER_TABLE),
  });

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

  /** Dados clínicos no tenant alvo via `X-Tenant-Id` (mesmo JWT do utilizador do tenant base). */
  const seedNPerTableForTenantId = async (
    label: string,
    actorToken: string,
    tenantId: string,
    tenantSlug: string,
  ): Promise<boolean> => {
    const xh = headersForTenant(tenantId);

    const patientIds: string[] = [];
    for (let i = 0; i < RECORDS_PER_TABLE; i++) {
      const p = await run(
        `${label}: patient ${i + 1}/${RECORDS_PER_TABLE}`,
        "POST",
        "/api/patients",
        {
          token: actorToken,
          extraHeaders: xh,
          body: {
            fullName: `Paciente ${tenantSlug} ${i + 1}`,
            internalCode: `p-${tenantSlug}-${ts}-${i}`,
            email: "",
          },
          allow: [201],
        },
      );
      if (!p.ok) return false;
      const pid = idFromPayload(p.payload);
      if (!pid) return false;
      patientIds.push(pid);
      mtLog(label, `Paciente criado`, {
        tenantId,
        indice: String(i + 1),
        patientId: pid,
      });
    }

    const consultationIds: string[] = [];
    for (let i = 0; i < RECORDS_PER_TABLE; i++) {
      const c = await run(
        `${label}: consultation ${i + 1}/${RECORDS_PER_TABLE}`,
        "POST",
        "/api/consultations",
        {
          token: actorToken,
          extraHeaders: xh,
          body: {
            patientId: patientIds[i],
            practitionerId: null,
            status: "scheduled",
            chiefComplaint: `Queixa ${tenantSlug} ${i + 1}`,
          },
          allow: [201],
        },
      );
      if (!c.ok) return false;
      const cid = idFromPayload(c.payload);
      if (!cid) return false;
      consultationIds.push(cid);
      mtLog(label, `Consulta criada`, {
        tenantId,
        indice: String(i + 1),
        consultationId: cid,
      });
    }

    const medicalRecordIds: string[] = [];
    for (let i = 0; i < RECORDS_PER_TABLE; i++) {
      const mr = await run(
        `${label}: medical-record ${i + 1}/${RECORDS_PER_TABLE}`,
        "POST",
        "/api/medical-records",
        {
          token: actorToken,
          extraHeaders: xh,
          body: {
            patientId: patientIds[i],
            bloodType: "O+",
            allergies: null,
            chronicConditions: null,
          },
          allow: [201],
        },
      );
      if (!mr.ok) return false;
      const mrid = idFromPayload(mr.payload);
      if (!mrid) return false;
      medicalRecordIds.push(mrid);
      mtLog(label, `Prontuário criado`, {
        tenantId,
        indice: String(i + 1),
        medicalRecordId: mrid,
      });
    }

    for (let i = 0; i < RECORDS_PER_TABLE; i++) {
      const e = await run(
        `${label}: medical-record-entry ${i + 1}/${RECORDS_PER_TABLE}`,
        "POST",
        "/api/medical-record-entries",
        {
          token: actorToken,
          extraHeaders: xh,
          body: {
            medicalRecordId: medicalRecordIds[i],
            consultationId: consultationIds[i],
            entryType: "progress",
            title: `Nota ${i + 1}`,
            content: `Entrada ${tenantSlug} #${i + 1} ts ${ts}`,
          },
          allow: [201],
        },
      );
      if (!e.ok) return false;
      const entryId = idFromPayload(e.payload);
      mtLog(label, `Entrada de prontuário criada`, {
        tenantId,
        indice: String(i + 1),
        entryId: entryId || "?",
      });
    }

    const listP = await run(
      `${label}: GET patients (confere ${RECORDS_PER_TABLE})`,
      "GET",
      "/api/patients",
      { token: actorToken, extraHeaders: xh, allow: [200] },
    );
    if (listP.ok && Array.isArray(listP.payload)) {
      rows[rows.length - 1].detail = `total=${listP.payload.length}`;
      mtLog(label, `Listagem pacientes`, {
        tenantId,
        total: String(listP.payload.length),
      });
    }

    return true;
  };

  const createThreeTenantsAndClinicalData = async (
    phase: "admin" | "normal",
    actorToken: string,
    slugPrefix: string,
  ): Promise<boolean> => {
    mtLog(phase, `— Fase: 3 tenants (${slugPrefix}-*) + dados (X-Tenant-Id) —`);

    const tenantIds: string[] = [];
    const slugs: string[] = [];

    for (let i = 0; i < 3; i++) {
      const slug = `${slugPrefix}-${ts}-${i}`;
      slugs.push(slug);
      const t = await run(
        `${phase}: POST tenant ${i + 1}/3 slug=${slug}`,
        "POST",
        "/api/tenants",
        {
          token: actorToken,
          body: {
            name: `Inst ${phase} ${i}`,
            slug,
            legalName: null,
            isActive: true,
          },
          allow: [201],
        },
      );
      if (!t.ok) return false;
      const tid = idFromPayload(t.payload);
      if (!tid) return false;
      tenantIds.push(tid);
      mtLog(phase, `Tenant criado`, {
        indice: String(i + 1),
        tenantId: tid,
        slug,
      });
    }

    for (let i = 0; i < 3; i++) {
      const slug = slugs[i];
      const tid = tenantIds[i];
      mtLog(phase, `→ Dados clínicos tenant ${i + 1}/3`, { tenantId: tid, slug });
      const okSeed = await seedNPerTableForTenantId(
        `${phase} tenant ${i + 1}/3`,
        actorToken,
        tid,
        slug,
      );
      if (!okSeed) return false;
    }
    return true;
  };

  const loginAdmin = await run(
    "Login admin (seed)",
    "POST",
    "/auth/login",
    {
      body: {
        tenantSlug: HOME_TENANT_SLUG,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      allow: [200],
    },
  );
  if (!loginAdmin.ok) {
    await writeReports(rows, ts, false, "Falha login admin");
    process.exitCode = 1;
    return;
  }
  const adminAuth = authFromLoginPayload(loginAdmin.payload);
  if (!adminAuth) {
    rows.push({
      step: "Abortar",
      method: "-",
      path: "-",
      status: 0,
      expected: "token",
      ok: false,
      ms: 0,
      detail: "Login admin sem token",
    });
    await writeReports(rows, ts, false, "Token admin inválido");
    process.exitCode = 1;
    return;
  }
  const adminToken = adminAuth.token;
  mtLog("admin", `Login admin OK`, {
    userId: adminAuth.userId,
    email: ADMIN_EMAIL,
    tenant: HOME_TENANT_SLUG,
  });

  const okAdminPhase = await createThreeTenantsAndClinicalData(
    "admin",
    adminToken,
    "mt-adm",
  );
  if (!okAdminPhase) {
    await writeReports(rows, ts, false, "Fase admin incompleta");
    process.exitCode = 1;
    return;
  }
  mtLog("admin", "Fase admin concluída");

  const normalEmail = `user-normal-${ts}@test.local`;
  const normalPassword = "SenhaNormal_9";
  const createNormal = await run(
    "Admin cria utilizador normal (staff) em clinica-exemplo",
    "POST",
    "/api/users",
    {
      token: adminToken,
      body: {
        email: normalEmail,
        password: normalPassword,
        fullName: "Utilizador normal",
        role: "staff",
      },
      allow: [201],
    },
  );
  if (!createNormal.ok) {
    await writeReports(rows, ts, false, "Falha criar utilizador normal");
    process.exitCode = 1;
    return;
  }
  const normalUserId = idFromPayload(createNormal.payload);
  mtLog("admin", `Utilizador normal criado`, {
    userId: normalUserId || "?",
    email: normalEmail,
  });

  const loginNormal = await run(
    "Login utilizador normal",
    "POST",
    "/auth/login",
    {
      body: {
        tenantSlug: HOME_TENANT_SLUG,
        email: normalEmail,
        password: normalPassword,
      },
      allow: [200],
    },
  );
  if (!loginNormal.ok) {
    await writeReports(rows, ts, false, "Falha login normal");
    process.exitCode = 1;
    return;
  }
  const normalAuth = authFromLoginPayload(loginNormal.payload);
  if (!normalAuth) {
    await writeReports(rows, ts, false, "Token normal inválido");
    process.exitCode = 1;
    return;
  }
  mtLog("normal", `Login utilizador normal OK`, {
    userId: normalAuth.userId,
    email: normalEmail,
  });

  const okNormalPhase = await createThreeTenantsAndClinicalData(
    "normal",
    normalAuth.token,
    "mt-nor",
  );
  if (!okNormalPhase) {
    await writeReports(rows, ts, false, "Fase utilizador normal incompleta");
    process.exitCode = 1;
    return;
  }
  mtLog("normal", "Fase utilizador normal concluída");

  const allOk = rows.every((r) => r.ok);
  if (allOk) {
    mtLog("fim", `Concluído com sucesso · ${rows.length} pedidos HTTP registados no relatório`);
  } else {
    mtLog("fim", `Terminou com falhas · ver relatório`);
  }
  await writeReports(
    rows,
    ts,
    allOk,
    `2 utilizadores; 6 tenants; ${RECORDS_PER_TABLE} registos/tabela/tenant (X-Tenant-Id)`,
  );
  process.exitCode = allOk ? 0 : 1;
}

async function writeReports(
  rows: ReportRow[],
  ts: number,
  allOk: boolean,
  titleNote: string,
) {
  const dir = join(process.cwd(), "teste", "relatorio");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.filter((r) => !r.ok).length;

  const lines: string[] = [
    `# Relatório — cenário multi-tenant (2 utilizadores, X-Tenant-Id)`,
    ``,
    `- **Data:** ${new Date().toISOString()}`,
    `- **Base:** \`${BASE}\``,
    `- **Tenant base:** \`${HOME_TENANT_SLUG}\``,
    `- **Nota:** ${titleNote}`,
    `- **Resultado:** ${allOk ? "OK" : "COM FALHAS"}`,
    `- **Passou:** ${passed} / **Falhou:** ${failed} / **Total:** ${rows.length}`,
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
      lines.push(
        `| | | | | | _${r.detail.replace(/\n/g, " ").slice(0, 220)}_ |`,
      );
    }
  }

  lines.push(
    ``,
    `---`,
    ``,
    `_Gerado por \`npm run test:multi-tenant\` → \`teste/multi-tenant-isolation-runner.ts\`_`,
  );

  const md = lines.join("\n");
  const fileNamed = join(dir, `relatorio-multi-tenant-${stamp}.md`);
  const fileUltimo = join(dir, "ultimo-multi-tenant.md");
  await writeFile(fileNamed, md, "utf8");
  await writeFile(fileUltimo, md, "utf8");
  console.log(`\n${LOG} Relatório: ${fileNamed}`);
  console.log(`${LOG} Cópia:     ${fileUltimo}`);
  console.log(`${LOG} Resumo: ${passed} ok, ${failed} falhas\n`);
}

void main();
