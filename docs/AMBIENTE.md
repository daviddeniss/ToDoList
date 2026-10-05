# 🧰 Preparando o Ambiente em Outra Máquina

Guia para configurar, do zero, um computador novo (Windows, Linux ou macOS) para desenvolver e rodar o
**ToDoList Fullstack**.

> Depois de preparar o ambiente, siga o [passo a passo para rodar o projeto](./COMO_RODAR.md).
> Para detalhes técnicos, veja a [documentação completa](./DOCUMENTACAO.md).

---

## Sumário

1. [O que você vai precisar](#1-o-que-você-vai-precisar)
2. [Instalar o Git](#2-instalar-o-git)
3. [Instalar o Node.js 22+](#3-instalar-o-nodejs-22)
4. [Ferramentas de compilação (só se necessário)](#4-ferramentas-de-compilação-só-se-necessário)
5. [Configurar o Git](#5-configurar-o-git)
6. [Clonar o repositório](#6-clonar-o-repositório)
7. [Instalar as dependências](#7-instalar-as-dependências)
8. [Configurar as variáveis de ambiente](#8-configurar-as-variáveis-de-ambiente)
9. [Configurar o editor (VS Code)](#9-configurar-o-editor-vs-code)
10. [Verificar se está tudo certo](#10-verificar-se-está-tudo-certo)
11. [Problemas comuns](#11-problemas-comuns)
12. [Checklist final](#12-checklist-final)

---

## 1. O que você vai precisar

| Ferramenta                    | Versão                                   | Obrigatória?                                                                | Para quê                                                 |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| Git                           | qualquer recente                         | ✅                                                                          | Baixar o código e versionar                              |
| Node.js                       | **22 ou superior** (recomendado: 22 LTS) | ✅                                                                          | Rodar o projeto                                          |
| npm                           | vem junto com o Node                     | ✅                                                                          | Instalar dependências                                    |
| Navegador moderno             | Chrome, Edge, Firefox ou Safari          | ✅                                                                          | Usar o frontend                                          |
| VS Code                       | qualquer recente                         | Recomendado                                                                 | Editor com lint/format integrados                        |
| Ferramentas de compilação C++ | —                                        | Só se necessário ([seção 4](#4-ferramentas-de-compilação-só-se-necessário)) | Compilar o `better-sqlite3` se não houver binário pronto |

> **Não é preciso instalar banco de dados.** O SQLite vem embutido no pacote `better-sqlite3` e o
> arquivo do banco é criado automaticamente.

---

## 2. Instalar o Git

**Windows**

- Baixe em <https://git-scm.com/download/win> e instale com as opções padrão
  (isso também instala o **Git Bash**).
- Ou, pelo terminal: `winget install --id Git.Git -e`

**macOS**

```bash
xcode-select --install     # instala o Git junto com as ferramentas de linha de comando
# ou: brew install git
```

**Linux (Debian/Ubuntu)**

```bash
sudo apt update && sudo apt install -y git
```

Confirme:

```bash
git --version
```

---

## 3. Instalar o Node.js 22+

O projeto exige **Node.js 22 ou superior** (definido em `engines` no `package.json` e no arquivo
`.nvmrc`). A forma recomendada é usar um **gerenciador de versões**, que permite ter várias versões do
Node na mesma máquina.

### Opção A — Gerenciador de versões (recomendado)

**Windows — nvm-windows**

1. Baixe o `nvm-setup.exe` em <https://github.com/coreybutler/nvm-windows/releases> e instale.
2. Abra um **novo** terminal e rode:

```powershell
nvm install 22
nvm use 22
```

**macOS / Linux — nvm**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
# feche e abra o terminal
nvm install 22
nvm use 22
```

> Dentro da pasta do projeto, `nvm use` (sem número) lê a versão do arquivo `.nvmrc` — no
> **nvm-windows** é preciso informar a versão: `nvm use 22`.

### Opção B — Instalador oficial

Baixe a versão **LTS 22.x** (ou mais nova) em <https://nodejs.org> e instale.

- No Windows, na tela **"Tools for Native Modules"**, você pode marcar a opção para instalar as
  ferramentas de compilação automaticamente (útil para a [seção 4](#4-ferramentas-de-compilação-só-se-necessário)).

### Confirme

```bash
node -v    # deve mostrar v22.x.x ou superior
npm -v
```

---

## 4. Ferramentas de compilação (só se necessário)

O pacote `better-sqlite3` tem uma parte nativa (C++). Nas plataformas comuns (Windows x64, macOS
Intel/Apple Silicon, Linux x64/arm64) com Node 22 ou 24, o npm **baixa um binário pronto** e nada
disso é necessário.

Só instale as ferramentas abaixo se o `npm install` falhar com mensagens como `node-gyp`,
`gyp ERR!` ou `prebuild-install` (por exemplo, numa versão muito nova do Node ou numa arquitetura
incomum):

**Windows**

- Instale o **Visual Studio Build Tools** em <https://visualstudio.microsoft.com/visual-cpp-build-tools/>
  e marque a carga de trabalho **"Desenvolvimento para desktop com C++"**.
- Instale o **Python 3**: `winget install Python.Python.3.12`

**macOS**

```bash
xcode-select --install
```

**Linux (Debian/Ubuntu)**

```bash
sudo apt install -y build-essential python3
```

Depois, rode `npm install` novamente.

---

## 5. Configurar o Git

Se for a primeira vez usando Git nessa máquina:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

**Finais de linha (importante no Windows):** o repositório usa LF (definido em `.gitattributes` e
`.editorconfig`). Para evitar diffs falsos:

```bash
git config --global core.autocrlf input
```

Para conseguir fazer **push** para o GitHub, autentique-se uma vez — pelo
[GitHub CLI](https://cli.github.com/) (`gh auth login`), pelo Git Credential Manager (abre uma
janela no primeiro push) ou configurando uma
[chave SSH](https://docs.github.com/pt/authentication/connecting-to-github-with-ssh).

---

## 6. Clonar o repositório

```bash
git clone https://github.com/daviddeniss/ToDoList.git
cd ToDoList
```

Se for trabalhar numa branch específica (ex.: a da refatoração):

```bash
git checkout refactor/profissionalizacao
```

> 💡 **Dica para Windows:** evite pastas sincronizadas pelo OneDrive para guardar o projeto — a
> sincronização da `node_modules` deixa tudo lento e pode travar arquivos.

---

## 7. Instalar as dependências

Na raiz do projeto:

```bash
npm ci
```

- `npm ci` instala **exatamente** as versões do `package-lock.json` (instalação reproduzível). Use
  `npm install` apenas quando for adicionar ou atualizar pacotes.
- A instalação também roda o script `prepare`, que ativa os **git hooks do Husky** (lint e formatação
  antes de cada commit).

### Aviso sobre "install scripts" (npm 11+)

Versões recentes do npm (11+) bloqueiam scripts de instalação de pacotes não aprovados. O projeto já
aprova os dois que precisam deles, no campo `allowScripts` do `package.json`:

- `better-sqlite3` — baixa/compila o SQLite nativo;
- `esbuild` — usado pelo `tsx`.

Se aparecer o aviso `install scripts not yet covered by allowScripts` (por exemplo, depois de
atualizar esses pacotes para uma versão nova), aprove e reinstale:

```bash
npm install-scripts approve better-sqlite3 esbuild
npm rebuild better-sqlite3 esbuild
```

Com o npm 10 (o que vem com o Node 22), os scripts rodam automaticamente e esse aviso não aparece.

---

## 8. Configurar as variáveis de ambiente

O projeto funciona **sem** arquivo `.env` (todas as variáveis têm valor padrão). Para personalizar,
crie o seu a partir do modelo:

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

Edite o `.env` conforme a necessidade. As variáveis disponíveis estão descritas no próprio
`.env.example` e na [documentação (seção 5)](./DOCUMENTACAO.md#5-configuração-variáveis-de-ambiente).

> O `.env` é pessoal de cada máquina e **não vai para o git**.

---

## 9. Configurar o editor (VS Code)

Extensões recomendadas:

| Extensão                                     | ID                          |
| -------------------------------------------- | --------------------------- |
| ESLint                                       | `dbaeumer.vscode-eslint`    |
| Prettier                                     | `esbenp.prettier-vscode`    |
| EditorConfig                                 | `EditorConfig.EditorConfig` |
| Jest (opcional)                              | `Orta.vscode-jest`          |
| SQLite Viewer (opcional, para olhar o banco) | `qwtel.sqlite-viewer`       |

Instalação pelo terminal:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension EditorConfig.EditorConfig
```

Configuração sugerida nas **configurações de usuário** do VS Code (`Ctrl+Shift+P` →
"Preferences: Open User Settings (JSON)"):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

> A última linha faz o VS Code usar o TypeScript **do projeto** (6.0), e não a versão embutida no
> editor. Ao abrir um arquivo `.ts`, aceite o aviso "Use Workspace Version", se aparecer.

---

## 10. Verificar se está tudo certo

Rode a mesma sequência que o CI executa:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Todos devem terminar sem erros (os testes devem mostrar `Tests: 40 passed` ou mais). Depois, siga o
[passo a passo para rodar](./COMO_RODAR.md).

---

## 11. Problemas comuns

| Sintoma                                                                     | Causa provável                                                                 | Solução                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm error engine Unsupported engine` / erros estranhos de sintaxe          | Node mais antigo que o 22                                                      | `node -v`; instale/ative o Node 22+ ([seção 3](#3-instalar-o-nodejs-22))                                                          |
| `gyp ERR!`, `node-gyp`, `prebuild-install` falhando                         | Sem binário pronto do `better-sqlite3` para sua plataforma                     | Instale as ferramentas da [seção 4](#4-ferramentas-de-compilação-só-se-necessário) e rode `npm install` de novo                   |
| `Could not locate the bindings file` / `better_sqlite3.node` não encontrado | Install script bloqueado, ou `node_modules` instalado com outra versão do Node | `npm rebuild better-sqlite3` (veja a [seção 7](#7-instalar-as-dependências)); se persistir, apague `node_modules` e rode `npm ci` |
| `NODE_MODULE_VERSION ... was compiled against a different Node.js version`  | Trocou a versão do Node depois de instalar                                     | `npm rebuild better-sqlite3`                                                                                                      |
| `'nvm' não é reconhecido`                                                   | Terminal aberto antes da instalação                                            | Feche e abra o terminal                                                                                                           |
| Hook do Husky não roda no commit                                            | `npm ci` rodado fora de um repositório git, ou com `--ignore-scripts`          | Rode `npx husky` na raiz do projeto                                                                                               |
| Diffs mostrando o arquivo inteiro alterado                                  | Conversão de final de linha (CRLF)                                             | `git config --global core.autocrlf input` e `git add --renormalize .`                                                             |
| `npm install` muito lento no Windows                                        | Antivírus ou OneDrive varrendo `node_modules`                                  | Mova o projeto para fora do OneDrive; adicione a pasta às exclusões do antivírus                                                  |
| `EACCES: permission denied` no Linux/macOS                                  | Node instalado com `sudo`                                                      | Use o nvm ([seção 3](#3-instalar-o-nodejs-22)); nunca rode `sudo npm install` no projeto                                          |

---

## 12. Checklist final

- [ ] `git --version` funciona
- [ ] `node -v` mostra **v22** ou superior
- [ ] Repositório clonado
- [ ] `npm ci` concluído sem erros
- [ ] (Opcional) `.env` criado a partir do `.env.example`
- [ ] VS Code com ESLint, Prettier e EditorConfig
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passando

✅ Ambiente pronto! Agora siga para [Como rodar o projeto](./COMO_RODAR.md).
