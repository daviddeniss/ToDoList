# ✅ ToDoList Fullstack

Aplicação de lista de tarefas com **API REST em TypeScript** (Express 5 + TypeORM + SQLite) e
**frontend em HTML/CSS/JavaScript puro**, servido pela própria API.

![CI](https://github.com/daviddeniss/ToDoList/actions/workflows/ci.yml/badge.svg)

## 📚 Documentação

| Documento                                     | Conteúdo                                                          |
| --------------------------------------------- | ----------------------------------------------------------------- |
| [Documentação completa](docs/DOCUMENTACAO.md) | Arquitetura, API, banco, segurança, testes, convenções e evolução |
| [Como rodar](docs/COMO_RODAR.md)              | Passo a passo para desenvolvimento, testes e produção             |
| [Preparar o ambiente](docs/AMBIENTE.md)       | Configuração de uma máquina nova (Windows, Linux e macOS)         |

## ✨ Funcionalidades

**Backend**

- CRUD completo de tarefas, versionado em `/api/v1`
- Filtros combináveis: status, busca textual e ordenação
- Validação de entrada com [Zod](https://zod.dev) e mensagens em português
- Formato de erro padronizado e tratamento centralizado
- Migrations versionadas com TypeORM
- Logs estruturados ([pino](https://getpino.io)), health check e _graceful shutdown_
- Segurança: Helmet (CSP), rate limit, CORS restrito e limite de tamanho do corpo
- Testes unitários e de integração com cobertura mínima de 80%

**Frontend**

- Adicionar, concluir, excluir, filtrar, buscar e ordenar tarefas
- Atualização otimista com _rollback_ em caso de erro
- Proteção contra XSS (renderização com `textContent`)
- Acessível: labels, `aria-*`, foco visível e respeito a `prefers-reduced-motion`
- Layout responsivo

## 🛠️ Tecnologias

| Camada    | Ferramentas                                                 |
| --------- | ----------------------------------------------------------- |
| Backend   | Node.js 22+, TypeScript, Express 5, TypeORM, better-sqlite3 |
| Validação | Zod                                                         |
| Logs      | pino, pino-http                                             |
| Segurança | helmet, express-rate-limit, cors                            |
| Testes    | Jest, ts-jest, supertest                                    |
| Qualidade | ESLint (typescript-eslint), Prettier, Husky, lint-staged    |
| Frontend  | HTML5, CSS3, JavaScript (ES Modules), Font Awesome          |
| CI        | GitHub Actions                                              |

## 🚀 Como rodar

Pré-requisito: **Node.js 22 ou superior** (veja `.nvmrc`).

```bash
# 1. Instale as dependências
npm install

# 2. (Opcional) Crie o arquivo de configuração
cp .env.example .env

# 3. Rode em modo de desenvolvimento (com hot-reload)
npm run dev
```

Acesse **http://localhost:3000**. As migrations são aplicadas automaticamente na inicialização e
o banco é criado em `data/database.sqlite`.

### Produção

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

> Para instalar só as dependências de produção, use `npm ci --omit=dev --ignore-scripts`
> (o `--ignore-scripts` evita rodar o `prepare` do Husky, que é dependência de desenvolvimento).

## ⚙️ Variáveis de ambiente

| Variável         | Padrão                 | Descrição                                                    |
| ---------------- | ---------------------- | ------------------------------------------------------------ |
| `NODE_ENV`       | `development`          | `development`, `test` ou `production`                        |
| `PORT`           | `3000`                 | Porta HTTP                                                   |
| `DATABASE_PATH`  | `data/database.sqlite` | Caminho do arquivo SQLite                                    |
| `CORS_ORIGIN`    | _(vazio)_              | Origens permitidas, separadas por vírgula. Vazio = sem CORS  |
| `LOG_LEVEL`      | `info`                 | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `RATE_LIMIT_MAX` | `100`                  | Requisições por IP, por minuto, na API                       |

Valores inválidos interrompem a inicialização com uma mensagem explicando o problema.

## 📜 Scripts

| Script                                                       | Descrição                                  |
| ------------------------------------------------------------ | ------------------------------------------ |
| `npm run dev`                                                | Servidor em desenvolvimento com hot-reload |
| `npm run build`                                              | Compila para `dist/`                       |
| `npm start`                                                  | Executa a versão compilada                 |
| `npm test`                                                   | Roda os testes                             |
| `npm run test:coverage`                                      | Testes com relatório de cobertura          |
| `npm run lint` / `lint:fix`                                  | Verifica / corrige problemas de lint       |
| `npm run format`                                             | Formata o código com Prettier              |
| `npm run typecheck`                                          | Checagem de tipos sem gerar arquivos       |
| `npm run migration:generate -- src/database/migrations/Nome` | Gera migration a partir das entidades      |
| `npm run migration:run` / `migration:revert`                 | Aplica / desfaz migrations                 |

## 📡 API

Base: `/api/v1`

| Método   | Rota                | Descrição                         | Sucesso |
| -------- | ------------------- | --------------------------------- | ------- |
| `GET`    | `/health`           | Health check (verifica o banco)   | `200`   |
| `GET`    | `/api/v1/todos`     | Lista tarefas                     | `200`   |
| `GET`    | `/api/v1/todos/:id` | Busca uma tarefa                  | `200`   |
| `POST`   | `/api/v1/todos`     | Cria uma tarefa                   | `201`   |
| `PATCH`  | `/api/v1/todos/:id` | Atualiza `title` e/ou `completed` | `200`   |
| `DELETE` | `/api/v1/todos/:id` | Remove uma tarefa                 | `204`   |

**Filtros de `GET /api/v1/todos`:** `status` (`all` \| `active` \| `completed`), `search` (texto) e
`sort` (`newest` \| `oldest`).

```bash
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Estudar TypeScript"}'
```

```json
{
  "id": "6f1c1c2e-8a4e-4c55-9d9b-2f3a7b1d0c11",
  "title": "Estudar TypeScript",
  "completed": false,
  "createdAt": "2026-10-04T21:24:00.000Z",
  "updatedAt": "2026-10-04T21:24:00.000Z"
}
```

**Formato de erro** (`400`, `404`, `413`, `429`, `500`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "path": "title", "message": "O título é obrigatório" }]
  }
}
```

## 🗂️ Estrutura

```
src/
├── config/env.ts              # variáveis de ambiente validadas
├── database/                  # DataSource e migrations
├── modules/todos/             # entity, schemas, repository, service, controller, routes
├── shared/                    # erros, middlewares e logger
├── app.ts                     # createApp(): monta o Express
└── server.ts                  # inicialização e graceful shutdown
public/                        # frontend (index.html, css/, js/)
tests/                         # testes unitários e de integração
```

Fluxo de uma requisição: `routes → controller (valida com Zod) → service (regras) → repository (TypeORM)`.
Erros de qualquer camada são convertidos no formato padrão pelo `error-handler`.
