# ▶️ Como Rodar o Projeto — Passo a Passo

Guia prático para colocar o **ToDoList Fullstack** para funcionar, em desenvolvimento e em produção.

> **Pré-requisito:** ambiente preparado (Git + Node.js 22+). Se ainda não preparou, siga primeiro
> [Preparando o ambiente](./AMBIENTE.md).

---

## Sumário

1. [Resumo rápido](#1-resumo-rápido)
2. [Rodar em modo de desenvolvimento](#2-rodar-em-modo-de-desenvolvimento)
3. [Usar a aplicação](#3-usar-a-aplicação)
4. [Testar a API pelo terminal](#4-testar-a-api-pelo-terminal)
5. [Rodar os testes automatizados](#5-rodar-os-testes-automatizados)
6. [Verificar a qualidade do código](#6-verificar-a-qualidade-do-código)
7. [Rodar em modo de produção](#7-rodar-em-modo-de-produção)
8. [Trabalhar com o banco de dados](#8-trabalhar-com-o-banco-de-dados)
9. [Mudar configurações (porta, logs...)](#9-mudar-configurações-porta-logs)
10. [Parar a aplicação](#10-parar-a-aplicação)
11. [Fluxo de trabalho do dia a dia](#11-fluxo-de-trabalho-do-dia-a-dia)
12. [Solução de problemas](#12-solução-de-problemas)

---

## 1. Resumo rápido

Para quem só quer ver funcionando:

```bash
git clone https://github.com/daviddeniss/ToDoList.git
cd ToDoList
npm ci
npm run dev
```

Abra **<http://localhost:3000>** no navegador. Pronto! 🎉

---

## 2. Rodar em modo de desenvolvimento

### Passo 1 — Entre na pasta do projeto

```bash
cd ToDoList
```

### Passo 2 — Instale as dependências

Só é necessário na primeira vez ou quando o `package-lock.json` mudar (por exemplo, depois de um
`git pull`):

```bash
npm ci
```

### Passo 3 — (Opcional) Crie o arquivo `.env`

Sem ele, a aplicação usa os valores padrão (porta 3000, banco em `data/database.sqlite`).

```bash
cp .env.example .env              # Linux / macOS / Git Bash
Copy-Item .env.example .env       # PowerShell
```

### Passo 4 — Inicie o servidor

```bash
npm run dev
```

Você verá algo assim:

```
[21:42:23] INFO (2936): Banco de dados conectado
    migrations: 1
[21:42:23] INFO (2936): Servidor rodando em http://localhost:3000
```

O que acontece nesse momento:

1. As variáveis de ambiente são lidas e validadas.
2. A pasta `data/` e o arquivo do banco são criados, se não existirem.
3. As **migrations** pendentes são aplicadas (na primeira execução, `migrations: 1`; depois, `0`).
4. O servidor HTTP sobe e passa a servir a API **e** o frontend.

O modo `dev` usa o `tsx watch`: **ao salvar qualquer arquivo em `src/`, o servidor reinicia
sozinho.** Alterações em `public/` (HTML/CSS/JS) não exigem reinício — basta recarregar a página
(`F5`).

### Passo 5 — Confirme que está no ar

Abra <http://localhost:3000/health> — deve aparecer:

```json
{ "status": "ok" }
```

---

## 3. Usar a aplicação

Acesse **<http://localhost:3000>**:

| Ação               | Como                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| Adicionar tarefa   | Digite no campo do topo e pressione **Enter** ou clique em **+**      |
| Concluir / reabrir | Clique na caixa de seleção ou no texto da tarefa                      |
| Excluir            | Clique no ícone de **lixeira**                                        |
| Filtrar            | Botões **Todas**, **Ativas** e **Concluídas**                         |
| Buscar             | Digite no campo **Buscar...** (a lista atualiza enquanto você digita) |
| Ordenar            | Seletor **Mais novas / Mais antigas**                                 |

O contador no rodapé mostra quantas tarefas estão na lista e quantas estão pendentes. Se algo der
errado (ex.: servidor desligado), uma mensagem vermelha aparece acima da lista.

---

## 4. Testar a API pelo terminal

Com o servidor rodando, abra **outro** terminal.

### Linux / macOS / Git Bash (curl)

```bash
# Criar
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Estudar TypeScript"}'

# Listar (com filtros opcionais)
curl "http://localhost:3000/api/v1/todos?status=active&sort=newest"

# Concluir (troque {id} pelo id retornado na criação)
curl -X PATCH http://localhost:3000/api/v1/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Excluir
curl -X DELETE http://localhost:3000/api/v1/todos/{id}
```

### Windows PowerShell

```powershell
# Criar
$todo = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/todos `
  -ContentType "application/json; charset=utf-8" -Body '{"title": "Estudar TypeScript"}'
$todo

# Listar
Invoke-RestMethod "http://localhost:3000/api/v1/todos?status=all"

# Concluir
Invoke-RestMethod -Method Patch -Uri "http://localhost:3000/api/v1/todos/$($todo.id)" `
  -ContentType "application/json" -Body '{"completed": true}'

# Excluir
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/api/v1/todos/$($todo.id)"
```

> ⚠️ No Windows, o `curl` pode enviar acentos com a codificação errada (aparecendo como `�`). Isso é
> do terminal, não da aplicação — prefira o `Invoke-RestMethod`, o Postman/Insomnia ou a própria
> interface para textos com acento.

A referência completa de rotas, parâmetros e erros está na
[documentação (seção 7)](./DOCUMENTACAO.md#7-referência-da-api).

---

## 5. Rodar os testes automatizados

Não é preciso subir o servidor — os testes criam a aplicação com um banco em memória.

```bash
npm test                 # roda todos os testes uma vez
npm run test:watch       # roda de novo a cada alteração (bom durante o desenvolvimento)
npm run test:coverage    # roda e gera o relatório de cobertura
```

Resultado esperado:

```
Test Suites: 3 passed, 3 total
Tests:       40 passed, 40 total
```

O relatório de cobertura em HTML fica em `coverage/lcov-report/index.html` — abra no navegador. O
comando falha se a cobertura ficar abaixo de **80%**.

Para rodar só um arquivo ou só testes com um nome:

```bash
npx jest tests/unit/todo.service.test.ts
npx jest -t "filtra por status"
```

---

## 6. Verificar a qualidade do código

Antes de abrir um Pull Request, rode a mesma sequência do CI:

```bash
npm run lint           # problemas de código   (corrigir: npm run lint:fix)
npm run format:check   # formatação             (corrigir: npm run format)
npm run typecheck      # erros de tipo
npm test
npm run build
```

> Ao fazer `git commit`, o **Husky** já roda ESLint e Prettier automaticamente nos arquivos
> alterados. Se o commit for bloqueado, leia o erro, corrija e tente de novo.

---

## 7. Rodar em modo de produção

Em produção, o TypeScript é compilado antes e executado com o Node puro (mais rápido e sem
ferramentas de desenvolvimento).

### Passo 1 — Instale e compile

```bash
npm ci
npm run build          # gera a pasta dist/
```

### Passo 2 — Inicie com `NODE_ENV=production`

**Linux / macOS / Git Bash**

```bash
NODE_ENV=production npm start
```

**Windows PowerShell**

```powershell
$env:NODE_ENV = "production"; npm start
```

**Windows CMD**

```cmd
set "NODE_ENV=production" && npm start
```

Ou defina `NODE_ENV=production` no arquivo `.env`.

Em produção, os logs saem em **JSON** (próprio para ferramentas de monitoramento).

### Instalando só o necessário para produção (servidor)

Num servidor, você pode compilar e depois remover as dependências de desenvolvimento:

```bash
npm ci
npm run build
npm ci --omit=dev --ignore-scripts   # o --ignore-scripts evita o "prepare" do Husky
npm rebuild better-sqlite3           # garante o binário nativo do SQLite
NODE_ENV=production npm start
```

Recomendações para um servidor real:

- Use um gerenciador de processos (ex.: **PM2** ou um serviço **systemd**) para reiniciar a
  aplicação em caso de queda.
- Coloque um proxy reverso com **HTTPS** na frente (ex.: Nginx, Caddy).
- Guarde o arquivo do banco (`DATABASE_PATH`) num local com **backup**.
- ⚠️ A aplicação não tem login: não a exponha na internet sem antes adicionar autenticação.

---

## 8. Trabalhar com o banco de dados

| Tarefa                                      | Como                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Onde fica o banco                           | `data/database.sqlite` (ou o valor de `DATABASE_PATH`)                                        |
| Ver os dados                                | Extensão **SQLite Viewer** no VS Code, ou [DB Browser for SQLite](https://sqlitebrowser.org/) |
| **Zerar** o banco                           | Pare o servidor e apague a pasta `data/`. Ao subir de novo, o banco é recriado vazio          |
| Aplicar migrations manualmente              | `npm run migration:run`                                                                       |
| Desfazer a última migration                 | `npm run migration:revert`                                                                    |
| Criar uma migration após mudar uma entidade | `npm run migration:generate -- src/database/migrations/NomeDaMudanca`                         |

Apagar a pasta `data/`:

```bash
rm -rf data                               # Linux / macOS / Git Bash
Remove-Item -Recurse -Force data          # PowerShell
```

> A pasta `data/` está no `.gitignore`: o banco de cada máquina é local e não vai para o repositório.

---

## 9. Mudar configurações (porta, logs...)

Edite o arquivo `.env` (ou defina a variável no terminal antes do comando):

```dotenv
PORT=4000
LOG_LEVEL=debug
RATE_LIMIT_MAX=300
```

Exemplos sem `.env`:

```bash
PORT=4000 npm run dev                       # Linux / macOS / Git Bash
```

```powershell
$env:PORT = "4000"; npm run dev             # PowerShell
```

Se um valor for inválido (ex.: `PORT=abc`), a aplicação não sobe e mostra exatamente o que está
errado. Todas as variáveis estão na
[documentação (seção 5)](./DOCUMENTACAO.md#5-configuração-variáveis-de-ambiente).

---

## 10. Parar a aplicação

No terminal onde o servidor está rodando, pressione **`Ctrl + C`**. A aplicação faz o encerramento
seguro (fecha as conexões e o banco) antes de sair.

---

## 11. Fluxo de trabalho do dia a dia

```bash
git checkout main
git pull                          # pega as últimas alterações
npm ci                            # só se o package-lock.json mudou
git checkout -b feat/minha-funcionalidade

npm run dev                       # terminal 1: servidor
npm run test:watch                # terminal 2: testes contínuos

# ... desenvolve ...

npm run lint && npm run typecheck && npm test
git add .
git commit -m "feat: descreve a funcionalidade"     # Husky roda lint/format
git push -u origin feat/minha-funcionalidade
# abra o Pull Request no GitHub e aguarde o CI ficar verde
```

---

## 12. Solução de problemas

| Problema                                                       | Solução                                                                                                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE: address already in use :::3000`                   | Outra aplicação usa a porta 3000. Feche-a ou mude a porta: `PORT=4000 npm run dev`. Para descobrir quem está usando: `netstat -ano \| findstr :3000` (Windows) ou `lsof -i :3000` (Linux/macOS) |
| `❌ Variáveis de ambiente inválidas`                           | Corrija o valor indicado na mensagem, no `.env` ou no terminal                                                                                                                                  |
| Página abre, mas a lista não carrega                           | Veja o log do servidor e o console do navegador (`F12`). Confirme <http://localhost:3000/health>                                                                                                |
| `429 Muitas requisições`                                       | Limite de 100 requisições/minuto atingido. Espere 1 minuto ou aumente `RATE_LIMIT_MAX`                                                                                                          |
| `Cannot find module` ao rodar `npm start`                      | Faltou compilar: rode `npm run build` antes                                                                                                                                                     |
| Erro com `better-sqlite3` / `bindings` / `NODE_MODULE_VERSION` | `npm rebuild better-sqlite3`. Veja também [Problemas comuns do ambiente](./AMBIENTE.md#11-problemas-comuns)                                                                                     |
| Dados estranhos ou erro de schema depois de mudanças           | Em desenvolvimento, apague a pasta `data/` e suba de novo                                                                                                                                       |
| Ícones não aparecem                                            | Os ícones vêm do CDN do Font Awesome: verifique a conexão com a internet                                                                                                                        |
| Commit bloqueado pelo Husky                                    | Rode `npm run lint:fix` e `npm run format`, revise e faça o commit de novo                                                                                                                      |
