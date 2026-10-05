# 📋 Plano de Refatoração — ToDoList Fullstack

> **Objetivo:** levar o projeto de um protótipo que hoje **não compila nem roda** para uma aplicação
> organizada, testada, segura e fácil de manter, seguindo boas práticas de mercado para
> Node.js + TypeScript.
>
> **Stack mantida:** Node.js, TypeScript, Express, TypeORM, SQLite, frontend em HTML/CSS/JS puro.
> A refatoração **não troca a stack**: melhora a estrutura, a qualidade e a confiabilidade do que já existe.

---

## ✅ Status da execução (04/10/2026)

As fases 0 a 11 foram executadas na branch `refactor/profissionalizacao`. Os itens opcionais
(Swagger e Docker) e a [seção 7](#7-fora-do-escopo--melhorias-futuras) ficaram de fora.

Decisões tomadas durante a execução que diferem do texto original do plano:

| Plano original                | O que foi feito                                                                            | Motivo                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver `sqlite3`              | `better-sqlite3`                                                                           | O TypeORM 1.x usa o `better-sqlite3` como driver SQLite; ele também tem binários prontos para o Node 22/24.                                                                  |
| TypeScript mais recente (7.x) | TypeScript **6.0**                                                                         | O `typescript-eslint` e o `ts-jest` ainda não suportam o TS 7.                                                                                                               |
| Middleware `validate.ts`      | Validação com Zod **no controller** (`schema.parse`)                                       | No Express 5, `req.query` é somente leitura; fazer o parse no controller mantém os tipos inferidos sem casts. Erros de validação continuam centralizados no `error-handler`. |
| `jest.config.ts`              | `jest.config.js`                                                                           | Ler a configuração em `.ts` exigiria instalar o `ts-node` só para isso.                                                                                                      |
| `dotenv`                      | `process.loadEnvFile()` nativo do Node                                                     | Uma dependência a menos.                                                                                                                                                     |
| Rate limit lido só do env     | `createApp({ rateLimitMax })` injetável                                                    | Permite testar sem alterar variáveis de ambiente.                                                                                                                            |
| Cobertura de `src/` inteiro   | `config/`, `logger.ts`, `server.ts`, `data-source.ts` e migrations ficam fora da cobertura | São código de inicialização/infra, validados pelos testes de integração e pelo smoke test.                                                                                   |

---

## Sumário

1. [Diagnóstico do estado atual](#1-diagnóstico-do-estado-atual)
2. [Princípios e decisões de arquitetura](#2-princípios-e-decisões-de-arquitetura)
3. [Estrutura de pastas proposta](#3-estrutura-de-pastas-proposta)
4. [Contrato da API (v1)](#4-contrato-da-api-v1)
5. [Fases da refatoração](#5-fases-da-refatoração)
6. [Checklist geral](#6-checklist-geral)
7. [Fora do escopo / melhorias futuras](#7-fora-do-escopo--melhorias-futuras)
8. [Pontos para decidir antes de começar](#8-pontos-para-decidir-antes-de-começar)

---

## 1. Diagnóstico do estado atual

Análise feita arquivo por arquivo. Os problemas estão classificados por severidade.

### 🔴 Críticos — impedem o projeto de compilar/rodar

| #   | Arquivo                           | Problema                                                                                                                                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | `api/src/app.ts`                  | Importa `./utils/errorHandler`, mas **o arquivo não existe**.                                                                                                                        |
| C2  | `api/src/routes/todoRoutes.ts`    | Usa os tipos `Request` e `Response` **sem importá-los do Express**. O TypeScript resolve para os tipos globais do `fetch` (DOM), o que gera erros como `res.status is not callable`. |
| C3  | `tsconfig.json`                   | `rootDir: "./src"` mas `include: ["api/src/**/*"]` → erro _"file is not under rootDir"_.                                                                                             |
| C4  | Todo o backend                    | `reflect-metadata` está instalado, mas **nunca é importado**. Os decorators do TypeORM falham sem ele.                                                                               |
| C5  | `data-source.ts`, `todoRoutes.ts` | Importam `./entities/Todo`, mas o arquivo se chama `todo.ts`. Funciona no Windows (case-insensitive), **quebra no Linux/Docker/CI**.                                                 |
| C6  | Repositório                       | Não há `package-lock.json` nem `.gitignore` → instalações não reproduzíveis e risco de comitar `node_modules`, `dist` e `database.sqlite`.                                           |

### 🟠 Altos — bugs e falhas de segurança

| #   | Arquivo               | Problema                                                                                                                                                                                                  |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `public/app.js`       | **XSS:** `todo.title` é inserido via `innerHTML` sem escape. Uma tarefa com título `<img src=x onerror=alert(1)>` executa código no navegador.                                                            |
| A2  | `todoRoutes.ts` (PUT) | **Mass assignment:** `todoRepository.merge(todo, req.body)` aceita qualquer campo do corpo — é possível sobrescrever `id` e `createdAt`.                                                                  |
| A3  | `todoRoutes.ts`       | **Sem validação de entrada:** `title` pode ser número, objeto, só espaços ou ter mais de 100 caracteres (SQLite não aplica `length`). `completed` pode ser qualquer tipo. `:id` não é validado como UUID. |
| A4  | `public/app.js`       | `fetch` não lança erro em respostas 4xx/5xx; o código nunca verifica `response.ok`. A UI marca a tarefa como concluída/removida **mesmo quando a API falha**.                                             |
| A5  | `data-source.ts`      | `synchronize: true` altera o schema automaticamente — perigoso fora de desenvolvimento (pode apagar dados). Não há migrations.                                                                            |
| A6  | `public/app.js`       | URL da API fixa em `http://localhost:3000`. O Express também não serve a pasta `public/`, então frontend e backend rodam separados sem motivo.                                                            |
| A7  | `app.ts`              | `cors()` liberado para qualquer origem; sem `helmet`, sem limite de tamanho de body, sem rate limit.                                                                                                      |

### 🟡 Médios — arquitetura e manutenibilidade

| #   | Onde            | Problema                                                                                                                                                                                  |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | `todoRoutes.ts` | Rota, regra de negócio e acesso a dados misturados no mesmo arquivo. Difícil testar e evoluir.                                                                                            |
| M2  | `todoRoutes.ts` | Repositório obtido no carregamento do módulo (acoplamento ao singleton `AppDataSource`) → impossível injetar um banco de teste.                                                           |
| M3  | Backend         | Cada rota tem seu `try/catch` com mensagens diferentes; formato de erro inconsistente; erros reais são engolidos (nada é logado).                                                         |
| M4  | `types/todo.ts` | Interface `Todo` duplicada e não utilizada (conflita em nome com a entidade).                                                                                                             |
| M5  | Configuração    | `PORT` e caminho do banco sem validação/centralização; sem `.env.example`.                                                                                                                |
| M6  | `server.ts`     | Sem _graceful shutdown_ (SIGINT/SIGTERM não fecham servidor e conexão com o banco). Logs via `console.log`.                                                                               |
| M7  | API             | `PUT` usado para atualização parcial (semântica correta é `PATCH`). Filtro `completed=""` é enviado como string vazia. Ordenação sem padrão quando `sort` não vem. Sem campo `updatedAt`. |
| M8  | `package.json`  | `main: index.js` inexistente, script `test` falso, `start` usa `ts-node` em produção, sem `engines`, sem lint/format.                                                                     |
| M9  | Testes          | O README cita Jest, mas **não existe nenhum teste**.                                                                                                                                      |
| M10 | `public/app.js` | Busca dispara uma requisição a cada tecla (sem _debounce_) → condições de corrida; re-registra listeners a cada render (sem _event delegation_).                                          |

### 🟢 Baixos — qualidade de UI/UX e documentação

| #   | Onde         | Problema                                                                                                                                                                                         |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | `index.html` | Inputs sem `<label>`/`aria-label`; botões só com ícone sem texto acessível; filtro sem `aria-pressed`.                                                                                           |
| B2  | `public/`    | Sem estado de _loading_, sem mensagem de lista vazia, sem feedback de erro para o usuário.                                                                                                       |
| B3  | `styles.css` | `--secondary` igual a `--primary`; input de busca com `width: 80%` desalinhado; `--success` não usado; sem foco visível (`:focus-visible`).                                                      |
| B4  | `README.md`  | Fica na raiz, mas o projeto está em `todolist-fullstack/`. Não explica como instalar, rodar ou testar. Lista funcionalidades que não existem (testes, validação, "tratamento de erros robusto"). |
| B5  | Repositório  | Projeto aninhado numa subpasta sem necessidade; pasta pai chama `Python` mas o projeto é Node (apenas observação).                                                                               |

---

## 2. Princípios e decisões de arquitetura

| Decisão                | Escolha                                                                                                    | Justificativa                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquitetura do backend | **Camadas por módulo**: `routes → controller → service → repository`                                       | Separa HTTP de regra de negócio e de persistência; cada camada testável isoladamente. Simples o bastante para o tamanho do projeto (sem over-engineering de Clean Architecture completa). |
| Organização            | **Por feature** (`modules/todos/`)                                                                         | Tudo de "todos" num lugar só; escala adicionando novos módulos.                                                                                                                           |
| Injeção de dependência | **Manual, por construtor** (sem framework de DI)                                                           | `createApp({ dataSource })` permite usar banco em memória nos testes.                                                                                                                     |
| Validação              | **Zod**                                                                                                    | Valida `body`, `params` e `query` e gera os tipos TypeScript a partir do schema (fonte única da verdade).                                                                                 |
| Configuração           | **`.env` + Zod** (`src/config/env.ts`)                                                                     | Falha rápido na inicialização se faltar/errar uma variável.                                                                                                                               |
| Erros                  | **Classe `AppError` + middleware central**                                                                 | Formato de erro único; nenhum `try/catch` repetido nas rotas (Express 5 propaga erros de `async` automaticamente).                                                                        |
| Express                | **Atualizar para Express 5**                                                                               | Suporte nativo a handlers `async`, melhor tratamento de erros.                                                                                                                            |
| Banco                  | **TypeORM com migrations**; `synchronize` só em teste                                                      | Evolução de schema versionada e segura.                                                                                                                                                   |
| Logs                   | **pino** + **pino-http**                                                                                   | Logs estruturados, rápidos; `pino-pretty` só em dev.                                                                                                                                      |
| Segurança              | **helmet**, CORS por whitelist, `express.json({ limit })`, **express-rate-limit**                          | Defesas básicas esperadas em qualquer API.                                                                                                                                                |
| Execução em dev        | **tsx** (`tsx watch`)                                                                                      | Substitui `ts-node`: mais rápido e com hot-reload.                                                                                                                                        |
| Produção               | `tsc` → `node dist/server.js`                                                                              | Não roda TypeScript em produção.                                                                                                                                                          |
| Testes                 | **Jest + ts-jest + supertest** (mantém o que o README promete)                                             | Unitários (service) + integração (rotas com SQLite em memória).                                                                                                                           |
| Qualidade              | **ESLint (flat config) + typescript-eslint + Prettier**, **Husky + lint-staged**, **Conventional Commits** | Padronização automática antes de cada commit.                                                                                                                                             |
| Frontend               | **JS puro com ES Modules** separados em `api`, `ui` e `main`                                               | Mantém a simplicidade (sem framework/bundler), mas com responsabilidades claras. Servido pelo próprio Express.                                                                            |
| CI                     | **GitHub Actions**: lint → typecheck → test → build                                                        | Garante que `main` sempre compila e passa nos testes.                                                                                                                                     |
| Node                   | **Node 22 LTS** fixado via `engines` + `.nvmrc`                                                            | Ambiente reproduzível.                                                                                                                                                                    |

---

## 3. Estrutura de pastas proposta

> Proposta: mover o conteúdo de `todolist-fullstack/` para a **raiz do repositório**
> (o repositório tem um único projeto). Ver [seção 8](#8-pontos-para-decidir-antes-de-começar).

```
ToDoList/
├── .github/
│   └── workflows/
│       └── ci.yml                    # lint, typecheck, testes e build
├── .husky/
│   └── pre-commit                    # roda lint-staged
├── public/                           # frontend estático (servido pelo Express)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── main.js                   # bootstrap e eventos
│       ├── api.js                    # cliente HTTP (fetch + tratamento de erro)
│       ├── ui.js                     # renderização segura do DOM
│       └── utils.js                  # debounce etc.
├── src/
│   ├── config/
│   │   └── env.ts                    # leitura e validação das variáveis de ambiente
│   ├── database/
│   │   ├── data-source.ts            # DataSource do TypeORM
│   │   └── migrations/
│   │       └── 1700000000000-CreateTodos.ts
│   ├── modules/
│   │   └── todos/
│   │       ├── todo.entity.ts
│   │       ├── todo.schemas.ts       # schemas Zod + tipos inferidos (DTOs)
│   │       ├── todo.repository.ts    # consultas (filtros, busca, ordenação)
│   │       ├── todo.service.ts       # regras de negócio
│   │       ├── todo.controller.ts    # traduz HTTP <-> service
│   │       └── todo.routes.ts        # definição das rotas + validação
│   ├── shared/
│   │   ├── errors/
│   │   │   └── app-error.ts          # AppError, NotFoundError, ValidationError
│   │   ├── middlewares/
│   │   │   ├── error-handler.ts
│   │   │   ├── not-found.ts
│   │   │   └── validate.ts           # middleware genérico de validação Zod
│   │   └── logger.ts                 # instância do pino
│   ├── app.ts                        # createApp(deps): monta o Express
│   └── server.ts                     # inicializa banco, sobe servidor, graceful shutdown
├── tests/
│   ├── helpers/
│   │   └── test-app.ts               # app com SQLite em memória
│   ├── unit/
│   │   └── todo.service.test.ts
│   └── integration/
│       └── todos.routes.test.ts
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierrc
├── eslint.config.mjs
├── jest.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json                     # usado pelo editor/testes
├── tsconfig.build.json               # usado no build (exclui testes)
├── README.md
└── PLANO_DE_REFATORACAO.md
```

### Responsabilidade de cada camada

```
Requisição HTTP
     │
     ▼
todo.routes.ts      → define verbo/URL e aplica validate(schema)
     │
     ▼
todo.controller.ts  → extrai dados validados de req, chama o service, define status HTTP
     │
     ▼
todo.service.ts     → regras de negócio (ex.: trim do título, lançar NotFoundError)
     │
     ▼
todo.repository.ts  → única camada que conhece o TypeORM / QueryBuilder
     │
     ▼
SQLite
```

Qualquer erro lançado em qualquer camada cai no `error-handler.ts`, que responde no formato padrão.

---

## 4. Contrato da API (v1)

Base: `/api/v1`

| Método   | Rota                | Descrição                                        | Sucesso                   |
| -------- | ------------------- | ------------------------------------------------ | ------------------------- |
| `GET`    | `/health`           | Health check (inclui ping no banco)              | `200`                     |
| `GET`    | `/api/v1/todos`     | Lista tarefas com filtros                        | `200`                     |
| `GET`    | `/api/v1/todos/:id` | Busca uma tarefa                                 | `200`                     |
| `POST`   | `/api/v1/todos`     | Cria tarefa                                      | `201` + header `Location` |
| `PATCH`  | `/api/v1/todos/:id` | Atualiza parcialmente (`title` e/ou `completed`) | `200`                     |
| `DELETE` | `/api/v1/todos/:id` | Remove tarefa                                    | `204`                     |

### Query params de `GET /todos`

| Param    | Valores                          | Padrão   |
| -------- | -------------------------------- | -------- |
| `status` | `all` \| `active` \| `completed` | `all`    |
| `search` | string (máx. 100)                | —        |
| `sort`   | `newest` \| `oldest`             | `newest` |

> Substitui o atual `completed=true|false|""`, que é ambíguo.

### Modelo `Todo`

```json
{
  "id": "6f1c1c2e-8a4e-4c55-9d9b-2f3a7b1d0c11",
  "title": "Estudar TypeScript",
  "completed": false,
  "createdAt": "2026-10-04T21:24:00.000Z",
  "updatedAt": "2026-10-04T21:24:00.000Z"
}
```

### Regras de validação

- `title`: string, obrigatório no POST, `trim()`, 1–100 caracteres.
- `completed`: boolean, opcional.
- `PATCH`: pelo menos um campo; **campos desconhecidos são rejeitados** (`.strict()`), resolvendo o mass assignment.
- `:id`: UUID válido, senão `400`.

### Formato padrão de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "path": "title", "message": "O título é obrigatório" }]
  }
}
```

Códigos: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500 — nunca expõe stack trace em produção).

---

## 5. Fases da refatoração

Cada fase termina com o projeto **funcionando** e vira **um ou mais commits** (Conventional Commits).
Recomendado: uma branch por fase (`refactor/fase-1-fundacao`, etc.) com PR para `main`.

---

### Fase 0 — Fundação do repositório

**Objetivo:** repositório limpo e instalação reproduzível.

- [ ] Mover `todolist-fullstack/*` para a raiz (`git mv`, preserva histórico).
- [ ] Criar `.gitignore` (`node_modules/`, `dist/`, `coverage/`, `*.sqlite`, `.env`, logs).
- [ ] Criar `.editorconfig`, `.nvmrc` (`22`), `engines` no `package.json`.
- [ ] Ajustar `package.json`: remover `main`, adicionar `"private": true`, descrição, licença.
- [ ] Gerar `package-lock.json` e comitar.

**Pronto quando:** `npm ci` funciona em uma máquina limpa.
**Commit:** `chore: reorganiza repositório e adiciona arquivos de configuração base`

---

### Fase 1 — Fazer o projeto compilar e rodar (correções críticas)

**Objetivo:** corrigir C1–C5 com o mínimo de mudanças, para ter uma linha de base funcional antes de reestruturar.

- [ ] Corrigir `tsconfig.json` (`rootDir`/`include` coerentes).
- [ ] Importar `reflect-metadata` no topo do `server.ts`.
- [ ] Padronizar nomes de arquivos em minúsculas e corrigir imports (C5).
- [ ] Importar `Request`/`Response` do Express.
- [ ] Criar o `errorHandler` que está faltando.
- [ ] Remover `types/todo.ts` (duplicado e sem uso).
- [ ] Trocar `ts-node` por `tsx`; scripts: `dev`, `build`, `start` (`node dist/server.js`), `typecheck`.

**Pronto quando:** `npm run typecheck` sem erros, `npm run dev` sobe a API e o CRUD funciona via curl/Postman.
**Commit:** `fix: corrige erros de compilação e inicialização da API`

---

### Fase 2 — Ferramentas de qualidade

- [ ] ESLint (flat config) + `typescript-eslint` (regras `recommended-type-checked`).
- [ ] Prettier + `eslint-config-prettier`.
- [ ] Husky + lint-staged (lint + format nos arquivos staged).
- [ ] Scripts: `lint`, `lint:fix`, `format`, `format:check`.
- [ ] Endurecer `tsconfig`: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames` (evita C5 no futuro).
- [ ] Criar `tsconfig.build.json` (exclui `tests/`).

**Pronto quando:** `npm run lint` e `npm run format:check` passam.
**Commit:** `chore: adiciona ESLint, Prettier, Husky e lint-staged`

---

### Fase 3 — Configuração, logs e infraestrutura do servidor

- [ ] `src/config/env.ts`: valida `NODE_ENV`, `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`, `LOG_LEVEL` com Zod.
- [ ] `.env.example` documentado.
- [ ] `src/shared/logger.ts` com pino (`pino-pretty` em dev) e `pino-http` no app.
- [ ] `app.ts` vira `createApp(deps)` (factory) — sem efeitos colaterais na importação.
- [ ] `server.ts`: inicializa banco → sobe servidor → _graceful shutdown_ em `SIGINT`/`SIGTERM` (fecha HTTP e `dataSource.destroy()`).
- [ ] Endpoint `GET /health`.
- [ ] Atualizar para **Express 5**.

**Commit:** `feat: centraliza configuração, adiciona logs estruturados e graceful shutdown`

---

### Fase 4 — Reestruturação em camadas (módulo `todos`)

- [ ] Criar `modules/todos/` com `entity`, `repository`, `service`, `controller`, `routes` conforme [seção 3](#3-estrutura-de-pastas-proposta).
- [ ] Repository recebe o `DataSource` por construtor (resolve M2).
- [ ] Service contém regras (trim, `NotFoundError` quando não existe).
- [ ] Controller sem `try/catch` (Express 5 encaminha erros de async).
- [ ] Montar rotas em `/api/v1/todos`.
- [ ] Trocar `PUT` por `PATCH`; adicionar `GET /:id`; `POST` retorna header `Location`.
- [ ] Ordenação padrão `newest`.

**Pronto quando:** mesmo comportamento funcional da Fase 1, porém com o novo contrato e as camadas separadas.
**Commit:** `refactor: organiza módulo de tarefas em camadas (routes/controller/service/repository)`

---

### Fase 5 — Validação e tratamento de erros

- [ ] `todo.schemas.ts`: `createTodoSchema`, `updateTodoSchema` (`.strict()`, pelo menos um campo), `todoIdParamSchema` (UUID), `listTodosQuerySchema`.
- [ ] Tipos (DTOs) inferidos com `z.infer` — sem interfaces duplicadas.
- [ ] Middleware `validate({ body, params, query })`.
- [ ] `AppError` + subclasses; `error-handler` mapeia `ZodError`, `AppError`, JSON malformado (`SyntaxError`) e erros desconhecidos → formato padrão; loga erros 5xx.
- [ ] Middleware `not-found` para rotas inexistentes (`404` no formato padrão).

**Resolve:** A2, A3, M3.
**Commit:** `feat: adiciona validação com Zod e tratamento centralizado de erros`

---

### Fase 6 — Banco de dados

- [ ] Renomear/ajustar entidade: `@CreateDateColumn`, `@UpdateDateColumn`, índice em `completed` e `createdAt`.
- [ ] Desligar `synchronize` (exceto em testes).
- [ ] Criar migration inicial `CreateTodos` + `migrationsRun` na inicialização (ou script dedicado).
- [ ] Scripts: `migration:generate`, `migration:run`, `migration:revert`.
- [ ] Caminho do banco vindo de `DATABASE_PATH` (ex.: `./data/database.sqlite`).
- [ ] Busca com escape de `%` e `_` no `LIKE`.

**Resolve:** A5.
**Commit:** `feat: adiciona migrations e campo updatedAt`

---

### Fase 7 — Segurança

- [ ] `helmet()` com CSP compatível com o Font Awesome do cdnjs.
- [ ] CORS restrito a `CORS_ORIGIN` (ou desabilitado, já que o frontend passa a ser servido pela mesma origem).
- [ ] `express.json({ limit: '10kb' })`.
- [ ] `express-rate-limit` em `/api`.
- [ ] `app.disable('x-powered-by')` (já coberto pelo helmet).
- [ ] `npm audit` no CI.

**Resolve:** A7.
**Commit:** `feat: adiciona camadas de segurança (helmet, rate limit, CORS restrito)`

---

### Fase 8 — Testes automatizados

- [ ] Configurar Jest + ts-jest + supertest; script `test`, `test:watch`, `test:coverage`.
- [ ] Helper `createTestApp()` com SQLite `:memory:` e `synchronize: true`.
- [ ] **Unitários** (`todo.service`): criar com trim, atualizar, `NotFoundError`, remover.
- [ ] **Integração** (rotas):
  - `POST` válido → 201; título vazio/longo/tipo errado → 400; campo extra → 400.
  - `GET` com cada combinação de `status`, `search`, `sort`.
  - `GET /:id` inexistente → 404; id inválido → 400.
  - `PATCH` parcial; tentativa de alterar `id`/`createdAt` → 400.
  - `DELETE` → 204; repetido → 404.
  - JSON malformado → 400; rota inexistente → 404.
- [ ] Meta de cobertura: **≥ 80%** (threshold no `jest.config.ts`).

**Commit:** `test: adiciona testes unitários e de integração da API`

---

### Fase 9 — Refatoração do frontend

- [ ] Express serve `public/` via `express.static`; `API_URL` passa a ser relativa (`/api/v1/todos`) — resolve A6.
- [ ] Dividir `app.js` em ES Modules (`api.js`, `ui.js`, `utils.js`, `main.js`) com `<script type="module">`.
- [ ] **Corrigir XSS:** montar itens com `document.createElement` + `textContent` (ou `<template>`), nunca `innerHTML` com dados do usuário — resolve A1.
- [ ] Cliente HTTP verifica `response.ok` e lança erro com a mensagem da API — resolve A4.
- [ ] Atualização otimista com _rollback_ em caso de erro (checkbox volta ao estado anterior).
- [ ] _Debounce_ (300 ms) na busca + `AbortController` para cancelar requisições antigas — resolve M10.
- [ ] _Event delegation_ em `#todoList` (um listener só).
- [ ] Estados de UI: carregando, lista vazia, mensagem de erro (toast/banner com `role="alert"`).
- [ ] Adaptar ao novo contrato (`status=all|active|completed`, `PATCH`).
- [ ] Limite de 100 caracteres no input (`maxlength`).

**Commit:** `refactor(web): modulariza frontend e corrige XSS e tratamento de erros`

---

### Fase 10 — Acessibilidade e UI

- [ ] `<label>` (visualmente oculto) ou `aria-label` em inputs, select e botões de ícone.
- [ ] `aria-pressed` nos botões de filtro; `aria-live="polite"` na lista.
- [ ] `:focus-visible` com contorno claro; contraste AA verificado.
- [ ] Ícones decorativos com `aria-hidden="true"`.
- [ ] CSS: corrigir variáveis (`--secondary`), largura do campo de busca, remover variáveis não usadas, `prefers-reduced-motion` para as animações.
- [ ] Contador de tarefas ("3 pendentes").

**Commit:** `feat(web): melhora acessibilidade e ajustes visuais`

---

### Fase 11 — CI e documentação

- [ ] `.github/workflows/ci.yml`: `npm ci` → `lint` → `format:check` → `typecheck` → `test:coverage` → `build` (Node 22).
- [ ] Reescrever `README.md`: descrição real, pré-requisitos, instalação, variáveis de ambiente, scripts, contrato da API, estrutura de pastas, como rodar testes, screenshot.
- [ ] (Opcional) Documentação OpenAPI/Swagger em `/api/docs`.
- [ ] (Opcional) `Dockerfile` multi-stage + `.dockerignore`.

**Commit:** `ci: adiciona pipeline do GitHub Actions` / `docs: reescreve README`

---

## 6. Checklist geral

### Scripts finais do `package.json`

| Script                                  | Comando                                     |
| --------------------------------------- | ------------------------------------------- |
| `dev`                                   | `tsx watch src/server.ts`                   |
| `build`                                 | `tsc -p tsconfig.build.json`                |
| `start`                                 | `node dist/server.js`                       |
| `typecheck`                             | `tsc --noEmit`                              |
| `lint` / `lint:fix`                     | `eslint .` / `eslint . --fix`               |
| `format` / `format:check`               | `prettier --write .` / `prettier --check .` |
| `test` / `test:watch` / `test:coverage` | `jest` / `jest --watch` / `jest --coverage` |
| `migration:run` / `migration:revert`    | via CLI do TypeORM                          |

### Dependências

**Produção:** `express@5`, `typeorm`, `sqlite3` (ou `better-sqlite3`), `reflect-metadata`, `zod`, `dotenv`, `pino`, `pino-http`, `helmet`, `cors`, `express-rate-limit`.

**Desenvolvimento:** `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`, `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`, `eslint`, `typescript-eslint`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`, `pino-pretty`.

**Removidas:** `ts-node`.

### Critérios de "pronto" do projeto todo

- [ ] `npm ci && npm run build && npm start` funciona em Linux, macOS e Windows.
- [ ] Lint, format, typecheck e testes passam no CI.
- [ ] Cobertura ≥ 80%.
- [ ] Nenhum problema crítico ou alto da [seção 1](#1-diagnóstico-do-estado-atual) permanece.
- [ ] README permite a qualquer pessoa rodar o projeto em menos de 5 minutos.

---

## 7. Fora do escopo / melhorias futuras

Ideias que **não** fazem parte desta refatoração, mas ficam mapeadas:

- Edição do título da tarefa na UI (duplo clique).
- Paginação na listagem (`page`, `limit`).
- Autenticação de usuários (JWT) e tarefas por usuário.
- Prioridade, data de vencimento e categorias.
- Migrar o frontend para um framework (React/Vue) com Vite.
- Trocar SQLite por PostgreSQL em produção.
- Testes E2E com Playwright.

---

## 8. Pontos para decidir antes de começar

1. **Mover o projeto para a raiz do repositório?** (recomendado: **sim**; o repositório só tem um projeto).
   Alternativa: manter `todolist-fullstack/` e mover o README para dentro dela.
2. **Express 4 → 5?** (recomendado: **sim**; elimina os `try/catch` repetidos).
3. **Jest ou Vitest?** O plano usa **Jest** porque o README já o menciona. Vitest é uma alternativa mais leve, se preferir.
4. **Versionar a API em `/api/v1`?** (recomendado: **sim**; custo zero agora, evita quebra no futuro).
5. **Ordem de execução:** seguir as fases em sequência. As fases 0 e 1 são pré-requisito para todas as outras;
   as fases 9–10 (frontend) podem ser feitas em paralelo às fases 6–8 depois que a Fase 4 estiver pronta.
