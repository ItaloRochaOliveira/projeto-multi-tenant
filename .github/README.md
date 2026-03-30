# API multi-tenant saúde

> Backend **Express + TypeScript**, base **MySQL**, sem frontend neste repositório. Convenções para novas rotas: `[.github/AI-ROUTE-PLAYBOOK.md](.github/AI-ROUTE-PLAYBOOK.md)`.

API REST para gestão **multi-tenant** (clínica / hospital): instituições, utilizadores, pacientes, consultas e prontuário eletrónico, com **isolamento por tenant**, **JWT**, validação com **Zod** e persistência **MySQL** via **TypeORM**.

## Funcionalidades

### Autenticação

- Login com `tenantSlug` + email + senha (JWT)
- Signup autenticado (criação de utilizadores num tenant)
- Middleware `authenticateToken` nas rotas protegidas
- Senhas com hash (bcrypt)

### Multi-tenant

- Tenant por instituição (`slug` único, uso em login e URLs públicas)
- Criação de instituições (`POST /api/tenants`) com JWT; `created_by_user_id` no tenant
- Dados clínicos com header opcional `**X-Tenant-Id`** (ver `src/utils/clinicalTenant.ts`): admin em qualquer tenant; staff só nos tenants que criou

### Domínio clínico

- CRUD de utilizadores (âmbito do tenant do JWT)
- CRUD de pacientes, consultas, prontuários e entradas de prontuário
- Soft delete onde aplicável (`deleted_at`)
- Tratamento centralizado de erros (Zod, 4xx, `ErrorMidleware`)

### Qualidade e testes

- `npm run test:locale` — smoke HTTP (`teste/local-api-runner.ts`)
- `npm run test:multi-tenant` — cenário multi-tenant (`teste/multi-tenant-isolation-runner.ts`)

### Documentação para IA / novas rotas

- Guia em `[.github/AI-ROUTE-PLAYBOOK.md](.github/AI-ROUTE-PLAYBOOK.md)` para adicionar rotas sem reexplorar o código inteiro

## Stack tecnológica

### Backend

- **Node.js** com **Express** 4
- **TypeScript**
- **MySQL 8** + **TypeORM**
- **JWT** (`jsonwebtoken`)
- **Zod** para validação de entrada
- **bcryptjs** para hash de senhas
- **Winston** para logs
- **jspdf** / **pdfmake** (disponíveis para geração de PDFs futura)

### Infraestrutura

- **Docker** + **Docker Compose** (API, MySQL, job de migração)
- `**init.sql`** — bootstrap do schema (primeiro volume vazio)
- `**migration.sql**` — migrações idempotentes a cada `docker compose up`

## Estrutura do projeto

```
multi-tenant/
├── src/
│   ├── app.ts                 # Express: montagem de rotas + CORS + JSON
│   ├── server.ts
│   ├── controller/          # Controladores (Zod, chamada a serviços)
│   ├── service/               # Lógica de negócio + repositórios (interfaces)
│   ├── service/repository/
│   │   └── typeorm/           # Implementações TypeORM
│   ├── middleware/          # auth, erros
│   ├── routes/              # Router por recurso
│   ├── db/
│   │   ├── appDataSource.ts
│   │   └── entities/        # Entidades TypeORM
│   ├── utils/               # apiResponse, clinicalTenant, etc.
│   └── env/                 # Variáveis validadas com Zod
├── teste/                   # Runners HTTP (smoke / multi-tenant)
├── .github/
│   ├── README.md
│   └── AI-ROUTE-PLAYBOOK.md   # Convenções para novas rotas (IA)
├── init.sql                 # Schema inicial (Docker / volume novo)
├── migration.sql            # Migrações incrementais
├── docker-compose.yml
├── Dockerfile
├── package.json
└── readme.md                # Este arquivo
```

## Como executar

### Pré-requisitos

- **Node.js 18+**
- **npm** ou **pnpm**
- **Docker** e **Docker Compose** (recomendado para MySQL + migrações)

### Desenvolvimento local (API)

1. **Clonar o repositório**

```bash
git clone <repositorio>
cd multi-tenant
```

2. **Instalar dependências**

```bash
npm install
# ou: pnpm install
```

3. **Configurar ambiente**

```bash
cp .env.example .env
```

Edite o `.env` (comentários em `.env.example` explicam host local vs Docker). Variáveis validadas em `src/env/index.ts`.

4. **Base de dados**

Garante que o MySQL existe e o schema está aplicado (`init.sql` / `migration.sql` ou Docker).

5. **Executar API**

```bash
npm run start:dev
```

A API sobe na porta definida em `**PORT**` (ex.: `http://127.0.0.1:3006`).

### Docker (recomendado)

Na raiz do projeto:

```bash
docker compose up -d
```

- **API:** `http://localhost:3006` (mapeamento em `docker-compose.yml`)
- **MySQL (host):** porta **3311** → 3306 no contentor
- Serviço `**migrate`** aplica `migration.sql` após o `db` ficar saudável; a **API** depende do migrate concluir com sucesso.

Rebuild da imagem da API após mudanças:

```bash
npm run docker:rebuild-api
```

## Funcionalidades detalhadas

### Fluxo de autenticação

1. Cliente envia `tenantSlug` (instituição), `email` e `password` em `POST /auth/login`
2. API devolve JWT com `userId`, `tenantId` (tenant base do utilizador), `role`, etc.
3. Rotas protegidas enviam `Authorization: Bearer <token>`
4. Para dados noutro tenant (PHI), enviar também `X-Tenant-Id: <uuid>` quando permitido pela regra (admin vs criador do tenant)

### Tenant e instituição

1. `GET /tenants/:slug` — dados públicos do tenant (sem JWT)
2. `POST /api/tenants` — cria instituição (JWT obrigatório); associa `created_by_user_id`

## Variáveis de ambiente

Validadas em `src/env/index.ts`:


| Variável         | Descrição                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| `PORT`           | Porta HTTP (default 3000 no schema; no Docker use 3006 alinhado ao Compose) |
| `ENV`            | Ambiente (ex.: `dev`)                                                       |
| `MYSQL_HOST`     | Host MySQL                                                                  |
| `MYSQL_PORT`     | Porta MySQL                                                                 |
| `MYSQL_USER`     | Utilizador                                                                  |
| `MYSQL_PASSWORD` | Senha                                                                       |
| `MYSQL_DATABASE` | Nome da base                                                                |
| `JWT_SECRET`     | Segredo JWT (mínimo 16 caracteres)                                          |

Modelo comentado: **`.env.example`** (copiar para `.env`). Para o contentor MySQL, o Compose também lê **`MYSQL_ROOT_PASSWORD`** (ver comentários no exemplo).

O `docker-compose` usa `env_file: .env` para `db`, `migrate` e `api`.

## Endpoints da API (resumo)

### Público

- `GET /` — metadados da API
- `GET /tenants/:slug` — tenant por slug

### Auth (`/auth`)

- `POST /auth/login` — login
- `POST /auth/signup` — JWT obrigatório; body inclui `tenantSlug`

### API (`/api/*` — JWT em geral, exceto conforme rota)


| Prefixo                       | Descrição                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| `/api/tenants`                | CRUD instituições (POST autenticado)                          |
| `/api/users`                  | Utilizadores do tenant do JWT                                 |
| `/api/patients`               | Pacientes (tenant efetivo via `X-Tenant-Id` quando aplicável) |
| `/api/consultations`          | Consultas                                                     |
| `/api/medical-records`        | Prontuários (cabeçalho por paciente)                          |
| `/api/medical-record-entries` | Entradas do prontuário                                        |


Lista detalhada e convenções para novas rotas: `[.github/AI-ROUTE-PLAYBOOK.md](.github/AI-ROUTE-PLAYBOOK.md)`.

## Exemplo de uso

### Login (desenvolvimento — seed em `init.sql`)

Corpo:

```json
{
  "tenantSlug": "clinica-exemplo",
  "email": "admin@clinica.local",
  "password": "DevAdmin123!"
}
```

Resposta (formato típico; envelope interno pode seguir `ServiceResult`):

```json
{
  "status": "success",
  "message": {
    "code": 200,
    "message": {
      "token": "<jwt>",
      "user": { "id": "...", "tenantId": "...", "email": "...", "role": "admin" }
    }
  }
}
```

### Pedido autenticado com tenant clínico explícito

```http
GET /api/patients
Authorization: Bearer <jwt>
X-Tenant-Id: <uuid-do-tenant-alvo>
```

## Segurança

### Implementações

- JWT com segredo configurável (`JWT_SECRET`)
- Hash de senhas com bcrypt
- Validação de entrada com **Zod**
- CORS habilitado no Express
- Isolamento de dados por `tenant_id` nas entidades; regras extra via `X-Tenant-Id` e `created_by_user_id`

### Boas práticas no código

- Separação controller → service → repositório
- Erros HTTP tipados (`BadRequest`, `NotFound`, `Unauthorized`, `Forbidden`)
- Variáveis de ambiente validadas na arranque

## Troubleshooting

### API não responde

```bash
curl http://127.0.0.1:3006/
```

Verifique `PORT` no `.env` e se o processo `npm run start:dev` está a correr.

### Erro de variáveis de ambiente

O processo termina com mensagem de `Invalid environment variables` — confira todos os campos obrigatórios em `src/env/index.ts`.

### MySQL / Docker

```bash
docker compose ps
docker compose logs db
docker compose logs api
```

Primeira subida com volume novo: `init.sql` corre automaticamente. Bases antigas: `migration.sql` via serviço `migrate`.

### Testes HTTP falham

```bash
npm run test:locale
```

Requer API acessível (ex.: `TEST_BASE_URL=http://127.0.0.1:3006`).

## Melhorias futuras

- Expor documentação OpenAPI/Swagger a partir das rotas
- Testes automatizados (Jest/Vitest) além dos runners HTTP
- Endpoints de geração de PDF (relatórios) usando `jspdf`/`pdfmake` já no projeto
- Rate limiting e auditoria de acessos

## Como contribuir

1. Faça um **fork** do repositório
2. Crie uma **branch** (`git checkout -b feature/minha-feature`)
3. **Commit** com mensagens claras
4. Abra um **Pull Request** descrevendo mudanças e impacto

## Licença

Este projeto está licenciado sob a **ISC License** (ver `package.json`).

## Contato

- **Italo Rocha Oliveira**
- [LinkedIn](https://www.linkedin.com/in/italorochaoliveira/)
- [GitHub](https://github.com/ItaloRochaOliveira)
- Email: [italo.rocha.de.oliveira@gmail.com](mailto:italo.rocha.de.oliveira@gmail.com)

**Desenvolvido com foco em clareza de domínio e isolamento multi-tenant.**