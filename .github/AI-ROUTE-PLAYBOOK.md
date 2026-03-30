# Playbook: novas rotas na API multi-tenant (Nest-free Express + TypeORM)

Este documento descreve **como o projeto está organizado** para que uma IA (ou um dev) implemente uma **nova rota** seguindo o mesmo padrão. O que muda de caso para caso é sobretudo a **regra de negócio** (e, se necessário, entidade/tabela e migração).

---

## 1. Stack e princípios

| Camada | Tecnologia / padrão |
|--------|---------------------|
| HTTP | Express 4 |
| Validação de entrada | Zod (`controller/.../schema/*.ts`) |
| Auth | JWT em `Authorization: Bearer`, middleware `authenticateToken` |
| Multi-tenant (dados clínicos) | Header opcional `X-Tenant-Id` + `resolveClinicalTenantId` em `src/utils/clinicalTenant.ts` |
| Persistência | TypeORM + repositórios em `src/service/repository/typeorm/` |
| Respostas de sucesso (serviços) | `ok(código, payload)` → `ServiceResult` em `src/utils/apiResponse.ts` |
| Erros HTTP | Classes em `src/utils/errors/` (`BadRequest`, `NotFound`, `Unauthorized`, `Forbidden`); tratamento em `src/middleware/ErrorMidleware.ts` (403 para `Forbidden`) |

**Alias de imports:** `@/` → `src/` (ver `tsconfig.json`).

---

## 2. Checklist rápido (nova rota REST JSON)

1. **Rota** — ficheiro em `src/routes/<nome>Routes.ts` (Router, métodos, `authenticateToken` se for protegida).
2. **Controller** — `src/controller/<Domínio>/<Nome>ApiController.ts`: parse com Zod, chama serviço, `res.status(...).json(resultado)`.
3. **Schema Zod** — `src/controller/<Domínio>/schema/<nome>Schemas.ts` (body/query/params).
4. **Serviço** — `src/service/<domínio>/<Nome>Service.ts` (ou `*CrudService.ts`): regras de negócio, `ok()`, `throw new BadRequest(...)` / `NotFound`, etc.
5. **Repositório** (se precisar de BD) — interface em `src/service/repository/` + implementação TypeORM em `src/service/repository/typeorm/`.
6. **Entidade** (se nova tabela) — `src/db/entities/`, export em `src/db/entities/index.ts`.
7. **SQL** — `init.sql` (bootstrap) + `migration.sql` (idempotente para bases já existentes).
8. **App** — registar o router em `src/app.ts`: `app.use("/api/...", ...Routes)`.

Ordem das rotas Express: definir rotas **estáticas** antes de **`/:id`** para não serem capturadas por parâmetros.

---

## 3. Ficheiros de referência (copiar o estilo)

| Conceito | Ficheiro exemplo |
|----------|------------------|
| Router CRUD + JWT | `src/routes/patientRoutes.ts` |
| Controller + tenant clínico | `src/controller/Patient/PatientApiController.ts` |
| Serviço CRUD | `src/service/patient/PatientCrudService.ts` |
| Schema Zod | `src/controller/Patient/schema/patientCrudSchemas.ts` |
| Tenant API (POST autenticado) | `src/routes/tenantApiRoutes.ts`, `TenantApiController` |
| Resolução de tenant para PHI | `src/utils/clinicalTenant.ts` |

---

## 4. Padrão do controller

- Assinatura: `(req: AuthRequest, res: Response, next: NextFunction)`.
- Sempre `try { ... } catch (e) { next(e); }`.
- Validar entrada: `AlgumSchema.parse(req.body)` ou `parse(req.params)` / `parse(req.query)`.
- Para recursos **escopados por tenant clínico**, usar:

  ```ts
  const tenantId = await resolveClinicalTenantId(req);
  ```

  Depois passar `tenantId` ao serviço (não usar só `req.user.tenantId` se a rota deve respeitar `X-Tenant-Id`).

- Resposta: o serviço devolve `ServiceResult`; o controller faz `res.status(códigoHttp).json(result)` — o código HTTP costuma ser o `message.code` interno ou 200/201 conforme o caso.

---

## 5. Padrão do serviço

- Construtor recebe repositórios (interfaces).
- Métodos retornam `Promise<ServiceResult<R>>` usando `import { ok } from "@/utils/apiResponse"`.
- Falhas: `throw new BadRequest("...")`, `new NotFound("...")`, etc. (mensagens em português, alinhadas ao projeto).

---

## 6. Autenticação e autorização

- **JWT obrigatório:** `router.use(authenticateToken)` no router (ou só nas rotas que precisem).
- **`req.user`:** `{ id, email, role, tenantId }` (tenant “base” do login).
- **Dados em outro tenant (PHI):** header `X-Tenant-Id: <uuid do tenant>`; `resolveClinicalTenantId` valida: `admin` pode qualquer tenant existente; `staff` só tenants com `created_by_user_id === req.user.id` (ver entidade `Tenant`).

---

## 7. Resposta de sucesso (`ServiceResult`)

Formato típico devolvido pelos serviços:

```json
{
  "status": "success",
  "message": {
    "code": 200,
    "message": { }
  }
}
```

Testes HTTP em `teste/local-api-runner.ts` às vezes “desembrulham” com `unwrapPayload` — manter consistência.

---

## 8. Erros

- **Zod:** tratado no `ErrorMidleware` (400).
- **BadRequest, NotFound, Unauthorized:** tratados (4xx).
- **Forbidden:** 403, tratado no `ErrorMidleware`.

---

## 9. Nova rota que devolve ficheiro (ex.: PDF)

Muitas rotas respondem JSON; para **PDF ou binário**, o fluxo é o mesmo até ao controller, mas a **resposta** muda:

1. Serviço pode devolver `Buffer` ou `Uint8Array` + metadados, **ou** o controller chama um serviço que gera o PDF e devolve buffer.
2. No controller **não** usar `res.json()` para o PDF; usar por exemplo:

   ```ts
   res.setHeader("Content-Type", "application/pdf");
   res.setHeader("Content-Disposition", 'attachment; filename="relatorio.pdf"');
   res.status(200).send(buffer);
   ```

3. Manter autenticação (`authenticateToken`) e, se aplicável, `resolveClinicalTenantId` antes de gerar o PDF.
4. Dependências: o projeto já referencia `jspdf` / `pdfmake` no `package.json` — escolher uma e centralizar geração num serviço (ex.: `PdfRelatorioService`) para a **única parte “nova”** ser a regra de negócio e o layout do documento.

**Exemplo de pedido ao agente de IA:**  
“Seguindo `.github/AI-ROUTE-PLAYBOOK.md`, adiciona `GET /api/relatorios/:id/pdf` autenticado, tenant via `X-Tenant-Id`, que gera PDF do recurso X; implementa só a regra de negócio em `RelatorioPdfService`.”

---

## 10. Base de dados

- Novas tabelas: DDL em **`init.sql`** (criação completa) e alterações incrementais idempotentes em **`migration.sql`** (procedimento + `CALL`, como no resto do ficheiro).
- Entidade TypeORM alinhada com nomes de colunas (`snake_case` em SQL, `camelCase` na entidade com `name: 'snake_case'` onde necessário).

---

## 11. Registo final

Depois de criar ficheiros:

1. `app.use("/api/<prefixo>", <nome>Routes);` em `src/app.ts`.
2. Atualizar a mensagem JSON da rota `GET /` em `src/app.ts` se quiseres documentação inline da API.
3. Correr `pnpm run build` (ou `npm run build`).

---

## 12. O que a IA deve tratar como “só negócio”

Em pedidos como “cria rota de geração de PDF”:

- **Já definido por este playbook:** estrutura de pastas, router, controller try/catch, Zod, JWT, `X-Tenant-Id`, formato de erro, build.
- **Novo / específico:** texto e layout do PDF, quais campos ler, regras de permissão extra, nome do ficheiro, caching, etc.

Fornecer sempre o **método HTTP**, **caminho**, **auth sim/não**, **body/query/params**, e se o recurso é multi-tenant via `X-Tenant-Id`.
