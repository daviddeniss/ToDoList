# 📘 Documentação do Projeto — ToDoList Fullstack

Documentação técnica completa: visão geral, arquitetura, API, banco de dados, frontend, segurança,
testes, qualidade de código e como evoluir o projeto.

> Guias relacionados:
>
> - [Como preparar o ambiente em outra máquina](./AMBIENTE.md)
> - [Passo a passo para rodar o projeto](./COMO_RODAR.md)

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Stack e versões](#2-stack-e-versões)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Arquitetura do backend](#4-arquitetura-do-backend)
5. [Configuração (variáveis de ambiente)](#5-configuração-variáveis-de-ambiente)
6. [Banco de dados](#6-banco-de-dados)
7. [Referência da API](#7-referência-da-api)
8. [Tratamento de erros](#8-tratamento-de-erros)
9. [Segurança](#9-segurança)
10. [Logs](#10-logs)
11. [Frontend](#11-frontend)
12. [Testes](#12-testes)
13. [Qualidade de código e convenções](#13-qualidade-de-código-e-convenções)
14. [Integração contínua (CI)](#14-integração-contínua-ci)
15. [Scripts npm](#15-scripts-npm)
16. [Como evoluir o projeto](#16-como-evoluir-o-projeto)
17. [Limitações conhecidas e próximos passos](#17-limitações-conhecidas-e-próximos-passos)

---

## 1. Visão geral

O **ToDoList Fullstack** é uma aplicação de lista de tarefas composta por:

- uma **API REST** em TypeScript (Express 5 + TypeORM + SQLite), versionada em `/api/v1`;
- um **frontend** em HTML, CSS e JavaScript puro (ES Modules), **servido pela própria API** — não há
  um servidor separado para o frontend.

### Funcionalidades

| Funcionalidade                 | Onde                                   |
| ------------------------------ | -------------------------------------- |
| Criar tarefa                   | `POST /api/v1/todos` / campo do topo   |
| Listar com filtros combináveis | `GET /api/v1/todos?status&search&sort` |
| Buscar uma tarefa              | `GET /api/v1/todos/:id`                |
| Concluir/reabrir e renomear    | `PATCH /api/v1/todos/:id` / checkbox   |
| Excluir                        | `DELETE /api/v1/todos/:id` / lixeira   |
| Verificar saúde da aplicação   | `GET /health`                          |

### Fluxo geral

```
Navegador ──HTTP──▶ Express ──▶ /api/v1/todos ──▶ controller ──▶ service ──▶ repository ──▶ SQLite
    ▲                  │
    └── HTML/CSS/JS ◀──┘ (express.static em public/)
```

---

## 2. Stack e versões

| Categoria         | Tecnologia                                                   | Versão      |
| ----------------- | ------------------------------------------------------------ | ----------- |
| Runtime           | Node.js                                                      | ≥ 22        |
| Linguagem         | TypeScript                                                   | 6.0         |
| Framework HTTP    | Express                                                      | 5.2         |
| ORM               | TypeORM                                                      | 1.1         |
| Banco             | SQLite via `better-sqlite3`                                  | 12.x        |
| Validação         | Zod                                                          | 4.x         |
| Logs              | pino / pino-http (pino-pretty em dev)                        | 10 / 11     |
| Segurança         | helmet, express-rate-limit, cors                             | 8 / 8 / 2   |
| Testes            | Jest, ts-jest, supertest                                     | 30 / 29 / 7 |
| Lint e formatação | ESLint + typescript-eslint, Prettier                         | 10 / 8 / 3  |
| Git hooks         | Husky + lint-staged                                          | 9 / 17      |
| Execução em dev   | tsx                                                          | 4.x         |
| Frontend          | HTML5, CSS3, JavaScript (ES Modules), Font Awesome 6.4 (CDN) | —           |

> **Por que TypeScript 6 e não 7?** O `typescript-eslint` e o `ts-jest` ainda não suportam o
> TypeScript 7. Ao atualizar, verifique a compatibilidade dessas duas ferramentas primeiro.

---

## 3. Estrutura de pastas

```
ToDoList/
├── .github/workflows/ci.yml        # pipeline de CI
├── .husky/pre-commit               # roda o lint-staged antes de cada commit
├── docs/                           # esta documentação
├── public/                         # frontend estático
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── main.js                 # estado, eventos e orquestração
│       ├── api.js                  # cliente HTTP da API
│       ├── ui.js                   # manipulação do DOM (TodoView)
│       └── utils.js                # debounce, pluralize
├── src/
│   ├── config/env.ts               # leitura e validação das variáveis de ambiente
│   ├── database/
│   │   ├── create-data-source.ts   # fábrica do DataSource (usada também nos testes)
│   │   ├── data-source.ts          # DataSource da aplicação e da CLI do TypeORM
│   │   └── migrations/             # migrations versionadas
│   ├── modules/todos/
│   │   ├── todo.entity.ts          # entidade TypeORM
│   │   ├── todo.schemas.ts         # schemas Zod + tipos (DTOs)
│   │   ├── todo.repository.ts      # acesso a dados
│   │   ├── todo.service.ts         # regras de negócio
│   │   ├── todo.controller.ts      # camada HTTP
│   │   └── todo.routes.ts          # rotas + montagem das dependências
│   ├── shared/
│   │   ├── errors/app-error.ts     # AppError, NotFoundError, TooManyRequestsError
│   │   ├── middlewares/
│   │   │   ├── error-handler.ts    # converte erros no formato padrão
│   │   │   └── not-found.ts        # 404 para rotas inexistentes
│   │   └── logger.ts               # instância do pino
│   ├── app.ts                      # createApp(): monta o Express
│   └── server.ts                   # ponto de entrada: banco, migrations, HTTP, shutdown
├── tests/
│   ├── helpers/test-context.ts     # app + SQLite em memória
│   ├── unit/                       # testes unitários
│   └── integration/                # testes de integração (HTTP)
├── .editorconfig  .gitattributes  .gitignore  .nvmrc  .prettierrc  .prettierignore
├── .env.example                    # modelo das variáveis de ambiente
├── eslint.config.mjs
├── jest.config.js
├── package.json  package-lock.json
├── tsconfig.json                   # editor, typecheck e testes
└── tsconfig.build.json             # build de produção (somente src/)
```

Pastas geradas e **ignoradas pelo git**: `node_modules/`, `dist/` (build), `coverage/` (cobertura) e
`data/` (banco SQLite).

---

## 4. Arquitetura do backend

### 4.1 Camadas

A API segue uma arquitetura em camadas, organizada **por módulo** (feature):

| Camada         | Arquivo              | Responsabilidade                                                    | Conhece               |
| -------------- | -------------------- | ------------------------------------------------------------------- | --------------------- |
| **Routes**     | `todo.routes.ts`     | Define verbo + URL e monta as dependências do módulo                | Controller            |
| **Controller** | `todo.controller.ts` | Valida a entrada com Zod, chama o service e define status/headers   | Express, Zod, Service |
| **Service**    | `todo.service.ts`    | Regras de negócio (ex.: lançar `NotFoundError`, aplicar alterações) | Repository            |
| **Repository** | `todo.repository.ts` | Única camada que fala com o TypeORM (consultas, filtros, ordenação) | TypeORM               |
| **Entity**     | `todo.entity.ts`     | Mapeamento da tabela `todos`                                        | TypeORM               |
| **Schemas**    | `todo.schemas.ts`    | Regras de validação e tipos de entrada (`z.infer`)                  | Zod                   |

Regra principal: **cada camada só conhece a camada logo abaixo**. O service não sabe que existe HTTP;
o controller não sabe que existe SQL.

### 4.2 Ciclo de uma requisição

```
POST /api/v1/todos  { "title": "  Estudar  " }
 │
 ├─ helmet → cors (se configurado) → pino-http → express.json (limite 10kb)
 ├─ rateLimit (/api)
 ├─ todo.routes      → controller.create
 ├─ controller       → createTodoSchema.parse(req.body)   ⇒ { title: "Estudar" }
 ├─ service.create   → repository.create
 ├─ repository       → INSERT INTO todos ...
 └─ controller       → 201 Created + header Location + JSON da tarefa

Em qualquer ponto, um erro lançado é capturado pelo Express 5 e enviado ao errorHandler.
```

### 4.3 Injeção de dependências

Não há framework de DI. As dependências são passadas por construtor:

```ts
// src/modules/todos/todo.routes.ts
const controller = new TodoController(new TodoService(new TodoRepository(dataSource)));
```

E a aplicação inteira é criada por uma _factory_, que recebe o banco:

```ts
// src/app.ts
export function createApp({
  dataSource,
  rateLimitMax = env.RATE_LIMIT_MAX,
}: AppDependencies): Express;
```

Isso permite que os testes criem a aplicação com um **SQLite em memória** e limites diferentes, sem
alterar código de produção nem variáveis de ambiente.

### 4.4 Inicialização (`src/server.ts`)

1. Importa `reflect-metadata` (necessário para os decorators do TypeORM).
2. Lê e valida o ambiente (`src/config/env.ts`) — se algo estiver inválido, encerra com mensagem clara.
3. Cria a pasta do banco, se não existir, e inicializa o `DataSource`.
4. **Aplica as migrations pendentes** automaticamente.
5. Cria o app e começa a escutar na porta `PORT`.
6. Em `SIGINT`/`SIGTERM` (Ctrl+C, parada de container), faz o **graceful shutdown**: para de aceitar
   conexões, fecha o banco e encerra. Se demorar mais de 10 s, encerra à força.

### 4.5 Ordem dos middlewares (`src/app.ts`)

| #   | Middleware                        | Escopo          | Função                                          |
| --- | --------------------------------- | --------------- | ----------------------------------------------- |
| 1   | `helmet()`                        | tudo            | Cabeçalhos de segurança (CSP, etc.)             |
| 2   | `cors()`                          | tudo            | Só se `CORS_ORIGIN` estiver definido            |
| 3   | `pinoHttp()`                      | tudo            | Log de cada requisição; disponibiliza `req.log` |
| 4   | `express.json({ limit: "10kb" })` | tudo            | Parse de JSON                                   |
| 5   | `GET /health`                     | rota            | Health check                                    |
| 6   | `rateLimit()`                     | `/api`          | Limite de requisições por IP                    |
| 7   | `createTodoRouter()`              | `/api/v1/todos` | Rotas de tarefas                                |
| 8   | `express.static(public/)`         | tudo            | Frontend                                        |
| 9   | `notFound`                        | tudo            | 404 em JSON para o que não casou                |
| 10  | `errorHandler`                    | tudo            | Resposta padronizada de erro                    |

---

## 5. Configuração (variáveis de ambiente)

As variáveis são lidas em `src/config/env.ts`:

1. Se existir um arquivo `.env` na raiz, ele é carregado com `process.loadEnvFile()` (nativo do Node).
2. As variáveis do sistema operacional **têm prioridade** sobre o `.env`.
3. Todos os valores são validados com Zod. Valor inválido ⇒ a aplicação **não sobe** e mostra o erro.

| Variável         | Tipo / valores                                                           | Padrão                 | Descrição                                                               |
| ---------------- | ------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------- |
| `NODE_ENV`       | `development` \| `test` \| `production`                                  | `development`          | Ambiente de execução                                                    |
| `PORT`           | inteiro 1–65535                                                          | `3000`                 | Porta HTTP                                                              |
| `DATABASE_PATH`  | texto                                                                    | `data/database.sqlite` | Caminho do arquivo SQLite (relativo à pasta onde o comando é executado) |
| `CORS_ORIGIN`    | lista separada por vírgula                                               | _(vazio)_              | Origens permitidas. Vazio = CORS desligado                              |
| `LOG_LEVEL`      | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` | `info`                 | Nível mínimo de log                                                     |
| `RATE_LIMIT_MAX` | inteiro positivo                                                         | `100`                  | Requisições por IP, **por minuto**, em `/api`                           |

Efeitos do `NODE_ENV`:

| Valor         | Efeito                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `development` | Logs coloridos (pino-pretty, se instalado); CSP sem `upgrade-insecure-requests` |
| `test`        | Logs silenciados (definido automaticamente pelo Jest)                           |
| `production`  | Logs em JSON; CSP com `upgrade-insecure-requests`                               |

Um modelo comentado está em [`.env.example`](../.env.example). O arquivo `.env` **nunca** deve ser
comitado (já está no `.gitignore`).

---

## 6. Banco de dados

### 6.1 Tecnologia

- **SQLite**, acessado pelo driver **`better-sqlite3`** através do **TypeORM 1.x**.
- O banco é um único arquivo (padrão `data/database.sqlite`). A pasta é criada automaticamente.
- Nos testes, usa-se `:memory:` (banco em memória, descartado ao final).

### 6.2 Modelo: tabela `todos`

| Coluna      | Tipo SQLite    | Regras                                                       |
| ----------- | -------------- | ------------------------------------------------------------ |
| `id`        | `varchar`      | PK, UUID v4 gerado pela aplicação                            |
| `title`     | `varchar(100)` | obrigatório                                                  |
| `completed` | `boolean`      | padrão `false`, **indexado**                                 |
| `createdAt` | `datetime`     | preenchido automaticamente (com milissegundos), **indexado** |
| `updatedAt` | `datetime`     | atualizado automaticamente a cada alteração                  |

> `createdAt` usa `strftime('%Y-%m-%d %H:%M:%f', 'now')` para guardar milissegundos. Assim, tarefas
> criadas no mesmo segundo continuam com ordenação estável.

### 6.3 Migrations

- `synchronize` está **desligado**: o schema só muda por migrations versionadas em
  `src/database/migrations/`.
- As migrations pendentes são aplicadas **automaticamente** ao iniciar o servidor.
- Os testes também rodam as migrations reais, garantindo que elas funcionam.

| Comando                                                               | Uso                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| `npm run migration:generate -- src/database/migrations/NomeDaMudanca` | Gera uma migration comparando as entidades com o banco |
| `npm run migration:run`                                               | Aplica as migrations pendentes manualmente             |
| `npm run migration:revert`                                            | Desfaz a última migration aplicada                     |

Migration atual: `1791160914378-CreateTodos.ts` (cria a tabela `todos` e os índices).

### 6.4 Busca textual

A busca usa `LIKE` com **escape** de `%`, `_` e `\`. Assim, buscar por `100%` encontra o texto literal
"100%", em vez de tratar `%` como curinga. No SQLite, o `LIKE` não diferencia maiúsculas de minúsculas
para letras sem acento (ASCII).

---

## 7. Referência da API

- **Base:** `http://localhost:3000`
- **Formato:** JSON (`Content-Type: application/json`) com codificação UTF-8
- **Datas:** ISO 8601 em UTC (ex.: `2026-10-04T21:24:00.000Z`)
- **Versão:** `/api/v1`

### 7.1 Objeto `Todo`

```json
{
  "id": "6f1c1c2e-8a4e-4c55-9d9b-2f3a7b1d0c11",
  "title": "Estudar TypeScript",
  "completed": false,
  "createdAt": "2026-10-04T21:24:00.000Z",
  "updatedAt": "2026-10-04T21:24:00.000Z"
}
```

### 7.2 `GET /health`

Verifica se a aplicação e o banco estão respondendo.

| Resposta | Corpo                                      |
| -------- | ------------------------------------------ |
| `200`    | `{ "status": "ok" }`                       |
| `500`    | erro `INTERNAL_ERROR` (banco indisponível) |

### 7.3 `GET /api/v1/todos` — listar

**Query params** (todos opcionais):

| Param    | Valores                      | Padrão   | Descrição                  |
| -------- | ---------------------------- | -------- | -------------------------- |
| `status` | `all`, `active`, `completed` | `all`    | Filtra por situação        |
| `search` | texto de até 100 caracteres  | —        | Busca no título (contém)   |
| `sort`   | `newest`, `oldest`           | `newest` | Ordena por data de criação |

Parâmetros desconhecidos são ignorados; valores inválidos retornam `400`.

```bash
curl "http://localhost:3000/api/v1/todos?status=active&search=estudar&sort=oldest"
```

| Resposta | Corpo              |
| -------- | ------------------ |
| `200`    | `Todo[]`           |
| `400`    | `VALIDATION_ERROR` |

### 7.4 `GET /api/v1/todos/:id` — buscar uma

| Resposta | Quando                    |
| -------- | ------------------------- |
| `200`    | Encontrada → `Todo`       |
| `400`    | `id` não é um UUID válido |
| `404`    | Não existe                |

### 7.5 `POST /api/v1/todos` — criar

**Corpo:**

| Campo   | Tipo   | Obrigatório | Regras                                               |
| ------- | ------ | ----------- | ---------------------------------------------------- |
| `title` | string | sim         | Espaços nas pontas são removidos; 1 a 100 caracteres |

Campos extras (ex.: `id`, `completed`) são **rejeitados** com `400`.

```bash
curl -i -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Estudar TypeScript"}'
```

| Resposta | Quando                                                  |
| -------- | ------------------------------------------------------- |
| `201`    | Criada → `Todo` + header `Location: /api/v1/todos/{id}` |
| `400`    | `VALIDATION_ERROR` ou `INVALID_JSON`                    |
| `413`    | Corpo maior que 10 kB                                   |

### 7.6 `PATCH /api/v1/todos/:id` — atualizar parcialmente

**Corpo** (ao menos um campo):

| Campo       | Tipo    | Regras                |
| ----------- | ------- | --------------------- |
| `title`     | string  | Mesmas regras do POST |
| `completed` | boolean | `true` ou `false`     |

Qualquer outro campo (`id`, `createdAt`, ...) é rejeitado — isso impede alterar campos protegidos.

```bash
curl -X PATCH http://localhost:3000/api/v1/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

| Resposta | Quando                                                    |
| -------- | --------------------------------------------------------- |
| `200`    | Atualizada → `Todo`                                       |
| `400`    | Corpo vazio, campo inválido/desconhecido ou `id` inválido |
| `404`    | Não existe                                                |

### 7.7 `DELETE /api/v1/todos/:id` — remover

| Resposta | Quando               |
| -------- | -------------------- |
| `204`    | Removida (sem corpo) |
| `400`    | `id` inválido        |
| `404`    | Não existe           |

### 7.8 Cabeçalhos de rate limit

As respostas de `/api` incluem os cabeçalhos padrão `RateLimit` e `RateLimit-Policy`
(draft-8 do IETF), indicando o limite e quanto resta na janela de 1 minuto.

---

## 8. Tratamento de erros

### 8.1 Formato padrão

Toda resposta de erro da API tem o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "path": "title", "message": "O título é obrigatório" }]
  }
}
```

`details` só aparece em erros de validação. `path` indica o campo (vazio quando o erro é no objeto
inteiro, como um campo desconhecido).

### 8.2 Códigos de erro

| HTTP | `code`              | Origem                                                          |
| ---- | ------------------- | --------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`  | Zod: corpo, parâmetros ou query inválidos                       |
| 400  | `INVALID_JSON`      | JSON malformado no corpo                                        |
| 404  | `NOT_FOUND`         | Tarefa inexistente ou rota inexistente                          |
| 413  | `PAYLOAD_TOO_LARGE` | Corpo acima de 10 kB                                            |
| 429  | `RATE_LIMITED`      | Limite de requisições excedido                                  |
| 500  | `INTERNAL_ERROR`    | Erro inesperado (detalhes **apenas no log**, nunca na resposta) |

### 8.3 Como funciona por dentro

- O **Express 5** encaminha automaticamente para o `errorHandler` qualquer exceção lançada em handlers
  `async` — por isso não há `try/catch` nos controllers.
- `ZodError` → 400; `AppError` (e subclasses) → usa `statusCode` e `code` próprios; erros do parser
  de JSON → 400/413; qualquer outro → 500, registrado no log com stack trace.
- Mensagens de validação estão em **português** (`z.config(z.locales.pt())` em `todo.schemas.ts`).

Para criar um erro de negócio novo:

```ts
// src/shared/errors/app-error.ts
export class ConflictError extends AppError {
  constructor(message = "Conflito") {
    super(409, "CONFLICT", message);
  }
}
```

---

## 9. Segurança

| Medida                   | Implementação                                                                             | Protege contra                       |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| Cabeçalhos de segurança  | `helmet()` (CSP, `X-Content-Type-Options`, `X-Frame-Options`, HSTS, sem `X-Powered-By`)   | XSS, clickjacking, sniffing          |
| Content Security Policy  | Scripts só da própria origem; estilos/fontes permitidos via HTTPS (Font Awesome no cdnjs) | Injeção de scripts                   |
| Validação estrita        | Zod com `strictObject`                                                                    | Mass assignment, dados inválidos     |
| Limite de corpo          | `express.json({ limit: "10kb" })`                                                         | Payloads gigantes                    |
| Rate limit               | 100 req/min por IP em `/api` (configurável)                                               | Abuso, força bruta, DoS simples      |
| CORS                     | Desligado por padrão; whitelist via `CORS_ORIGIN`                                         | Uso da API por sites não autorizados |
| SQL parametrizado        | QueryBuilder com parâmetros + escape do `LIKE`                                            | SQL injection                        |
| Frontend sem `innerHTML` | `<template>` + `textContent`                                                              | XSS armazenado                       |
| Erros 500 genéricos      | Stack trace só no log                                                                     | Vazamento de informações internas    |
| Auditoria                | `npm audit` no CI                                                                         | Dependências vulneráveis             |

> ⚠️ A aplicação **não tem autenticação**: qualquer pessoa com acesso à URL pode ler e alterar as
> tarefas. Não a exponha publicamente sem adicionar autenticação (veja a seção 17).

---

## 10. Logs

- Biblioteca: **pino** (logs estruturados em JSON) + **pino-http** (um log por requisição, com método,
  URL, status e tempo de resposta).
- Em `development`, se o `pino-pretty` estiver instalado, os logs saem coloridos e legíveis.
- Em `production`, saem em JSON — ideal para ferramentas como Datadog, Loki ou CloudWatch.
- Em `test`, ficam silenciados.
- Nível controlado por `LOG_LEVEL`.
- Dentro de handlers, use `req.log` (já associado à requisição); fora deles, use `logger` de
  `src/shared/logger.ts`.

---

## 11. Frontend

### 11.1 Arquitetura

JavaScript puro com **ES Modules** (`<script type="module">`), sem bundler nem framework:

| Arquivo       | Responsabilidade                                                                     |
| ------------- | ------------------------------------------------------------------------------------ |
| `js/api.js`   | Cliente HTTP. Converte respostas 4xx/5xx em `ApiError` com a mensagem vinda da API   |
| `js/ui.js`    | Classe `TodoView`: única parte que mexe no DOM (renderizar, loading, erros, filtros) |
| `js/utils.js` | `debounce` e `pluralize`                                                             |
| `js/main.js`  | Estado da tela (`status`, `search`, `sort`, `todos`), eventos e orquestração         |

A API é chamada por URL **relativa** (`/api/v1/todos`), pois o frontend é servido pela mesma origem.

### 11.2 Comportamentos

| Comportamento       | Como                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Renderização segura | Cada item é clonado de um `<template>` e o título entra via `textContent`                                      |
| Busca               | _Debounce_ de 300 ms + `AbortController` cancela a requisição anterior (evita respostas fora de ordem)         |
| Concluir tarefa     | **Atualização otimista**: a tela muda na hora e volta ao estado anterior se a API falhar                       |
| Filtro ativo        | Ao concluir uma tarefa com filtro "Ativas"/"Concluídas", a lista é recarregada                                 |
| Eventos             | **Delegação**: um único listener na `<ul>` atende todos os itens                                               |
| Erros               | Mensagem exibida num banner (`role="alert"`) por 5 segundos                                                    |
| Estados             | Lista com opacidade reduzida durante carregamento; mensagem de lista vazia; contador "N tarefas · M pendentes" |

### 11.3 Acessibilidade

- Todos os campos têm `<label>` (visualmente oculto quando necessário).
- Botões só com ícone têm `aria-label`; ícones decorativos têm `aria-hidden="true"`.
- Filtros usam `aria-pressed`; a lista usa `aria-live="polite"` e `aria-busy`.
- Foco visível em todos os elementos (`:focus-visible`).
- Animações desligadas para quem usa `prefers-reduced-motion`.
- Layout responsivo (quebra em coluna abaixo de 600 px).

---

## 12. Testes

### 12.1 Ferramentas

**Jest** + **ts-jest** (TypeScript) + **supertest** (requisições HTTP sem subir servidor).

### 12.2 Tipos de teste

| Tipo       | Pasta                | O que cobre                                                                                                                                                                            |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitário   | `tests/unit/`        | `TodoService` com repositório _mockado_ (regras de negócio isoladas)                                                                                                                   |
| Integração | `tests/integration/` | A aplicação inteira via HTTP, com SQLite em memória e migrations reais: todas as rotas, filtros, ordenação, validações, erros, rate limit, cabeçalhos de segurança e frontend estático |

O helper `tests/helpers/test-context.ts` cria, para cada teste, um banco novo em memória — os testes
são independentes entre si.

### 12.3 Cobertura

- Mínimo exigido: **80%** de linhas, funções, branches e statements (o Jest falha abaixo disso).
- Ficam fora da medição os arquivos de inicialização/infra: `server.ts`, `config/`, `logger.ts`,
  `data-source.ts` e `migrations/`.
- Relatório HTML: `coverage/lcov-report/index.html` (após `npm run test:coverage`).

### 12.4 Escrevendo um teste de integração

```ts
import request from "supertest";
import { createTestContext, type TestContext } from "../helpers/test-context";

describe("Minha funcionalidade", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
  });

  it("faz algo", async () => {
    await request(ctx.app).get("/api/v1/todos").expect(200);
  });
});
```

---

## 13. Qualidade de código e convenções

### 13.1 Ferramentas

| Ferramenta          | Configuração                        | Função                                                                                                 |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TypeScript          | `tsconfig.json`                     | Modo `strict` + `noUncheckedIndexedAccess`, `noUnusedLocals`, `forceConsistentCasingInFileNames`, etc. |
| ESLint              | `eslint.config.mjs`                 | Regras recomendadas + regras com checagem de tipos do typescript-eslint; `import type` obrigatório     |
| Prettier            | `.prettierrc`                       | Formatação (100 colunas, aspas duplas, vírgula final)                                                  |
| EditorConfig        | `.editorconfig`                     | UTF-8, LF, 2 espaços                                                                                   |
| Husky + lint-staged | `.husky/pre-commit`, `package.json` | Antes de cada commit, roda ESLint `--fix` e Prettier **apenas nos arquivos alterados**                 |
| `.gitattributes`    | —                                   | Força finais de linha LF no repositório (evita diffs falsos entre Windows e Linux)                     |

### 13.2 Convenções

- **Nomes de arquivos:** minúsculos, no formato `modulo.camada.ts` (ex.: `todo.service.ts`).
- **Código** em inglês; **mensagens ao usuário e comentários** em português.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em português, por
  exemplo `feat: adiciona prioridade às tarefas`, `fix: corrige ordenação`, `test: ...`, `docs: ...`,
  `refactor: ...`, `chore: ...`, `ci: ...`.
- **Branches:** `feat/...`, `fix/...`, `refactor/...`, `docs/...` com Pull Request para a `main`.
- Nunca use `--no-verify` para pular o hook: corrija o problema apontado.

---

## 14. Integração contínua (CI)

Arquivo: `.github/workflows/ci.yml`. Roda em todo **push na `main`** e em todo **Pull Request**, nas
versões **Node 22 e 24**:

1. `npm ci` — instalação limpa e reproduzível
2. `npm run lint`
3. `npm run format:check`
4. `npm run typecheck`
5. `npm run test:coverage` — falha se a cobertura cair abaixo de 80%
6. `npm run build`
7. `npm audit --omit=dev --audit-level=high`

Um PR só deve ser mesclado com o CI verde.

---

## 15. Scripts npm

| Script                               | Comando                             | Descrição                                            |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------------- |
| `dev`                                | `tsx watch src/server.ts`           | Desenvolvimento com recarga automática               |
| `build`                              | `tsc -p tsconfig.build.json`        | Compila `src/` para `dist/`                          |
| `start`                              | `node dist/server.js`               | Executa o build (produção)                           |
| `typecheck`                          | `tsc --noEmit`                      | Checa tipos de `src/` e `tests/`                     |
| `lint` / `lint:fix`                  | `eslint .`                          | Verifica / corrige lint                              |
| `format` / `format:check`            | `prettier`                          | Formata / verifica formatação                        |
| `test`                               | `jest`                              | Roda os testes                                       |
| `test:watch`                         | `jest --watch`                      | Testes em modo observação                            |
| `test:coverage`                      | `jest --coverage`                   | Testes + cobertura                                   |
| `typeorm`                            | `tsx ./node_modules/typeorm/cli.js` | CLI do TypeORM                                       |
| `migration:generate`                 | —                                   | Gera migration (passe o caminho após `--`)           |
| `migration:run` / `migration:revert` | —                                   | Aplica / desfaz migrations                           |
| `prepare`                            | `husky`                             | Instala os git hooks (roda sozinho no `npm install`) |

---

## 16. Como evoluir o projeto

### 16.1 Adicionar um campo à tarefa (ex.: `priority`)

1. **Entidade** — adicione a coluna em `todo.entity.ts`.
2. **Migration** — `npm run migration:generate -- src/database/migrations/AddPriorityToTodos` e
   revise o arquivo gerado (troque o import para `import type`).
3. **Schemas** — inclua o campo em `createTodoSchema`/`updateTodoSchema`.
4. **Service** — aplique o campo em `create`/`update`.
5. **Repository** — se for filtrável/ordenável, ajuste `findMany` (e o `listTodosQuerySchema`).
6. **Testes** — cubra os casos válidos e inválidos.
7. **Frontend** — ajuste `index.html`, `ui.js` e `main.js`.
8. **Documentação** — atualize a seção 7 deste arquivo.

### 16.2 Adicionar um novo módulo (ex.: `categories`)

1. Crie `src/modules/categories/` com `category.entity.ts`, `category.schemas.ts`,
   `category.repository.ts`, `category.service.ts`, `category.controller.ts` e `category.routes.ts`,
   seguindo o módulo `todos`.
2. Registre a entidade em `src/database/create-data-source.ts` (`entities: [Todo, Category]`).
3. Gere a migration.
4. Monte as rotas em `src/app.ts`:
   `app.use("/api/v1/categories", createCategoryRouter(dataSource));`
5. Escreva testes unitários e de integração.

### 16.3 Mudanças que quebram o contrato da API

Mantenha `/api/v1` funcionando e crie `/api/v2` para a nova versão, para não quebrar clientes antigos.

---

## 17. Limitações conhecidas e próximos passos

| Limitação                                                                       | Sugestão                                            |
| ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Sem autenticação: todos compartilham as mesmas tarefas                          | JWT ou sessão, com tarefas por usuário              |
| Sem paginação na listagem                                                       | Parâmetros `page`/`limit` ou cursor                 |
| Não é possível editar o título pela interface (só pela API)                     | Edição com duplo clique                             |
| SQLite: um arquivo local, sem acesso concorrente pesado                         | PostgreSQL em produção (o TypeORM facilita a troca) |
| Rate limit em memória (zera ao reiniciar; não é compartilhado entre instâncias) | Store em Redis se houver várias instâncias          |
| Busca sem distinção de maiúsculas apenas para letras sem acento                 | Coluna normalizada ou busca full-text (FTS5)        |
| Sem testes E2E do frontend                                                      | Playwright                                          |
| Sem documentação OpenAPI                                                        | Swagger em `/api/docs`                              |
| Sem Docker                                                                      | `Dockerfile` multi-stage                            |
