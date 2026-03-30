# Relatório — cenário multi-tenant (2 utilizadores, X-Tenant-Id)

- **Data:** 2026-03-30T16:41:36.881Z
- **Base:** `http://127.0.0.1:3006`
- **Tenant base:** `clinica-exemplo`
- **Nota:** 2 utilizadores; 6 tenants; 3 registos/tabela/tenant (X-Tenant-Id)
- **Resultado:** OK
- **Passou:** 87 / **Falhou:** 0 / **Total:** 87

| OK | ms | Método | Caminho | HTTP | Passo |
|:--:|-----:|:-------|:--------|-----:|:------|
| ✓ | 1288 | POST | `/auth/login` | 200 | Login admin (seed) |
| ✓ | 54 | POST | `/api/tenants` | 201 | admin: POST tenant 1/3 slug=mt-adm-1774888890674-0 |
| ✓ | 58 | POST | `/api/tenants` | 201 | admin: POST tenant 2/3 slug=mt-adm-1774888890674-1 |
| ✓ | 51 | POST | `/api/tenants` | 201 | admin: POST tenant 3/3 slug=mt-adm-1774888890674-2 |
| ✓ | 66 | POST | `/api/patients` | 201 | admin tenant 1/3: patient 1/3 |
| ✓ | 130 | POST | `/api/patients` | 201 | admin tenant 1/3: patient 2/3 |
| ✓ | 103 | POST | `/api/patients` | 201 | admin tenant 1/3: patient 3/3 |
| ✓ | 98 | POST | `/api/consultations` | 201 | admin tenant 1/3: consultation 1/3 |
| ✓ | 113 | POST | `/api/consultations` | 201 | admin tenant 1/3: consultation 2/3 |
| ✓ | 86 | POST | `/api/consultations` | 201 | admin tenant 1/3: consultation 3/3 |
| ✓ | 64 | POST | `/api/medical-records` | 201 | admin tenant 1/3: medical-record 1/3 |
| ✓ | 121 | POST | `/api/medical-records` | 201 | admin tenant 1/3: medical-record 2/3 |
| ✓ | 106 | POST | `/api/medical-records` | 201 | admin tenant 1/3: medical-record 3/3 |
| ✓ | 41 | POST | `/api/medical-record-entries` | 201 | admin tenant 1/3: medical-record-entry 1/3 |
| ✓ | 64 | POST | `/api/medical-record-entries` | 201 | admin tenant 1/3: medical-record-entry 2/3 |
| ✓ | 37 | POST | `/api/medical-record-entries` | 201 | admin tenant 1/3: medical-record-entry 3/3 |
| ✓ | 8 | GET | `/api/patients` | 200 | admin tenant 1/3: GET patients (confere 3) |
| | | | | | _total=3_ |
| ✓ | 29 | POST | `/api/patients` | 201 | admin tenant 2/3: patient 1/3 |
| ✓ | 23 | POST | `/api/patients` | 201 | admin tenant 2/3: patient 2/3 |
| ✓ | 21 | POST | `/api/patients` | 201 | admin tenant 2/3: patient 3/3 |
| ✓ | 27 | POST | `/api/consultations` | 201 | admin tenant 2/3: consultation 1/3 |
| ✓ | 31 | POST | `/api/consultations` | 201 | admin tenant 2/3: consultation 2/3 |
| ✓ | 20 | POST | `/api/consultations` | 201 | admin tenant 2/3: consultation 3/3 |
| ✓ | 21 | POST | `/api/medical-records` | 201 | admin tenant 2/3: medical-record 1/3 |
| ✓ | 18 | POST | `/api/medical-records` | 201 | admin tenant 2/3: medical-record 2/3 |
| ✓ | 29 | POST | `/api/medical-records` | 201 | admin tenant 2/3: medical-record 3/3 |
| ✓ | 39 | POST | `/api/medical-record-entries` | 201 | admin tenant 2/3: medical-record-entry 1/3 |
| ✓ | 20 | POST | `/api/medical-record-entries` | 201 | admin tenant 2/3: medical-record-entry 2/3 |
| ✓ | 48 | POST | `/api/medical-record-entries` | 201 | admin tenant 2/3: medical-record-entry 3/3 |
| ✓ | 6 | GET | `/api/patients` | 200 | admin tenant 2/3: GET patients (confere 3) |
| | | | | | _total=3_ |
| ✓ | 20 | POST | `/api/patients` | 201 | admin tenant 3/3: patient 1/3 |
| ✓ | 21 | POST | `/api/patients` | 201 | admin tenant 3/3: patient 2/3 |
| ✓ | 27 | POST | `/api/patients` | 201 | admin tenant 3/3: patient 3/3 |
| ✓ | 39 | POST | `/api/consultations` | 201 | admin tenant 3/3: consultation 1/3 |
| ✓ | 17 | POST | `/api/consultations` | 201 | admin tenant 3/3: consultation 2/3 |
| ✓ | 22 | POST | `/api/consultations` | 201 | admin tenant 3/3: consultation 3/3 |
| ✓ | 54 | POST | `/api/medical-records` | 201 | admin tenant 3/3: medical-record 1/3 |
| ✓ | 23 | POST | `/api/medical-records` | 201 | admin tenant 3/3: medical-record 2/3 |
| ✓ | 22 | POST | `/api/medical-records` | 201 | admin tenant 3/3: medical-record 3/3 |
| ✓ | 40 | POST | `/api/medical-record-entries` | 201 | admin tenant 3/3: medical-record-entry 1/3 |
| ✓ | 30 | POST | `/api/medical-record-entries` | 201 | admin tenant 3/3: medical-record-entry 2/3 |
| ✓ | 18 | POST | `/api/medical-record-entries` | 201 | admin tenant 3/3: medical-record-entry 3/3 |
| ✓ | 7 | GET | `/api/patients` | 200 | admin tenant 3/3: GET patients (confere 3) |
| | | | | | _total=3_ |
| ✓ | 1021 | POST | `/api/users` | 201 | Admin cria utilizador normal (staff) em clinica-exemplo |
| ✓ | 974 | POST | `/auth/login` | 200 | Login utilizador normal |
| ✓ | 36 | POST | `/api/tenants` | 201 | normal: POST tenant 1/3 slug=mt-nor-1774888890674-0 |
| ✓ | 43 | POST | `/api/tenants` | 201 | normal: POST tenant 2/3 slug=mt-nor-1774888890674-1 |
| ✓ | 26 | POST | `/api/tenants` | 201 | normal: POST tenant 3/3 slug=mt-nor-1774888890674-2 |
| ✓ | 19 | POST | `/api/patients` | 201 | normal tenant 1/3: patient 1/3 |
| ✓ | 46 | POST | `/api/patients` | 201 | normal tenant 1/3: patient 2/3 |
| ✓ | 17 | POST | `/api/patients` | 201 | normal tenant 1/3: patient 3/3 |
| ✓ | 20 | POST | `/api/consultations` | 201 | normal tenant 1/3: consultation 1/3 |
| ✓ | 20 | POST | `/api/consultations` | 201 | normal tenant 1/3: consultation 2/3 |
| ✓ | 39 | POST | `/api/consultations` | 201 | normal tenant 1/3: consultation 3/3 |
| ✓ | 19 | POST | `/api/medical-records` | 201 | normal tenant 1/3: medical-record 1/3 |
| ✓ | 22 | POST | `/api/medical-records` | 201 | normal tenant 1/3: medical-record 2/3 |
| ✓ | 19 | POST | `/api/medical-records` | 201 | normal tenant 1/3: medical-record 3/3 |
| ✓ | 20 | POST | `/api/medical-record-entries` | 201 | normal tenant 1/3: medical-record-entry 1/3 |
| ✓ | 20 | POST | `/api/medical-record-entries` | 201 | normal tenant 1/3: medical-record-entry 2/3 |
| ✓ | 40 | POST | `/api/medical-record-entries` | 201 | normal tenant 1/3: medical-record-entry 3/3 |
| ✓ | 7 | GET | `/api/patients` | 200 | normal tenant 1/3: GET patients (confere 3) |
| | | | | | _total=3_ |
| ✓ | 20 | POST | `/api/patients` | 201 | normal tenant 2/3: patient 1/3 |
| ✓ | 24 | POST | `/api/patients` | 201 | normal tenant 2/3: patient 2/3 |
| ✓ | 40 | POST | `/api/patients` | 201 | normal tenant 2/3: patient 3/3 |
| ✓ | 17 | POST | `/api/consultations` | 201 | normal tenant 2/3: consultation 1/3 |
| ✓ | 20 | POST | `/api/consultations` | 201 | normal tenant 2/3: consultation 2/3 |
| ✓ | 22 | POST | `/api/consultations` | 201 | normal tenant 2/3: consultation 3/3 |
| ✓ | 18 | POST | `/api/medical-records` | 201 | normal tenant 2/3: medical-record 1/3 |
| ✓ | 45 | POST | `/api/medical-records` | 201 | normal tenant 2/3: medical-record 2/3 |
| ✓ | 23 | POST | `/api/medical-records` | 201 | normal tenant 2/3: medical-record 3/3 |
| ✓ | 22 | POST | `/api/medical-record-entries` | 201 | normal tenant 2/3: medical-record-entry 1/3 |
| ✓ | 24 | POST | `/api/medical-record-entries` | 201 | normal tenant 2/3: medical-record-entry 2/3 |
| ✓ | 39 | POST | `/api/medical-record-entries` | 201 | normal tenant 2/3: medical-record-entry 3/3 |
| ✓ | 7 | GET | `/api/patients` | 200 | normal tenant 2/3: GET patients (confere 3) |
| | | | | | _total=3_ |
| ✓ | 20 | POST | `/api/patients` | 201 | normal tenant 3/3: patient 1/3 |
| ✓ | 37 | POST | `/api/patients` | 201 | normal tenant 3/3: patient 2/3 |
| ✓ | 21 | POST | `/api/patients` | 201 | normal tenant 3/3: patient 3/3 |
| ✓ | 17 | POST | `/api/consultations` | 201 | normal tenant 3/3: consultation 1/3 |
| ✓ | 19 | POST | `/api/consultations` | 201 | normal tenant 3/3: consultation 2/3 |
| ✓ | 19 | POST | `/api/consultations` | 201 | normal tenant 3/3: consultation 3/3 |
| ✓ | 19 | POST | `/api/medical-records` | 201 | normal tenant 3/3: medical-record 1/3 |
| ✓ | 28 | POST | `/api/medical-records` | 201 | normal tenant 3/3: medical-record 2/3 |
| ✓ | 23 | POST | `/api/medical-records` | 201 | normal tenant 3/3: medical-record 3/3 |
| ✓ | 20 | POST | `/api/medical-record-entries` | 201 | normal tenant 3/3: medical-record-entry 1/3 |
| ✓ | 21 | POST | `/api/medical-record-entries` | 201 | normal tenant 3/3: medical-record-entry 2/3 |
| ✓ | 42 | POST | `/api/medical-record-entries` | 201 | normal tenant 3/3: medical-record-entry 3/3 |
| ✓ | 7 | GET | `/api/patients` | 200 | normal tenant 3/3: GET patients (confere 3) |
| | | | | | _total=3_ |

---

_Gerado por `npm run test:multi-tenant` → `teste/multi-tenant-isolation-runner.ts`_