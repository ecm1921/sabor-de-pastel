# Sabor de Pastel v2: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o app de navegador único por um sistema compartilhado: cliente pede pelo celular, balconistas e admin atendem com login, tudo atualiza em tempo real e cada ação fica no log.

**Architecture:** SPA em React + Vite + TypeScript publicada no GitHub Pages. Supabase (PostgreSQL, Auth, Realtime) guarda os dados. As regras que importam (preço, total, numeração, transição de status, permissões, log) ficam no banco, em funções SQL e RLS. O front-end só chama essas funções.

**Tech Stack:** React 18.3, Vite 5, TypeScript 5, React Router 6 (HashRouter), @supabase/supabase-js 2, Vitest 2 + Testing Library, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-14-sabor-de-pastel-design.md`

## Global Constraints

- Prazo final: 28/11/2026. Versão usável na pastelaria até 21/11/2026, para ter uma semana de uso real (critério de sucesso da spec).
- Toda a interface em português do Brasil. Valores em reais com `toLocaleString("pt-BR", {style:"currency", currency:"BRL"})`.
- Tipos de pedido: `Retirada`, `Entrega`. Nada de Balcão ou Mesa.
- Pagamentos: `Dinheiro`, `Pix`, `Cartão`. Categorias: `Pastéis`, `Bebidas`, `Outros`.
- Status: `recebido`, `preparando`, `pronto`, `entregue`, `cancelado`. Rótulo de `pronto`: "Pronto" em Retirada, "Saiu para entrega" em Entrega. Os demais: "Recebido", "Preparando", "Entregue", "Cancelado".
- Transições permitidas: `recebido→preparando`, `recebido→cancelado`, `preparando→pronto`, `preparando→cancelado`, `pronto→entregue`. Nenhuma outra.
- Pastéis têm `preco_m` e `preco_g`. Bebidas e Outros têm `preco`.
- Login por usuário e senha. E-mail só para recuperar senha.
- Papéis: `admin` vê tudo. `balconista` não altera cardápio nem vê log. Visitante não lista pedidos.
- O front-end usa só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A chave `service_role` nunca entra no repositório nem no build.
- Rotas com HashRouter (`/#/`, `/#/pedido/:id`, `/#/atendente`), porque o GitHub Pages não reescreve URLs. Base do Vite: `/sabor-de-pastel/`.
- Alvos de toque com no mínimo 44px. Contraste AA. Sem rolagem horizontal em 360px de largura.
- O app antigo vai para `legado/index.html` (serve de "antes" no relatório) e deixa de ser a página principal.

## Review Focus

1. **Cliente toca duas vezes em "Enviar" ou a rede demora:** deve existir um único pedido. Teste na Task 10 (`envia uma vez mesmo com dois cliques`).
2. **Item fica esgotado entre montar o carrinho e enviar:** o banco recusa e a tela diz qual item saiu. Teste SQL na Task 3 (`item inativo é recusado`) e mapeamento de erro na Task 6.
3. **Admin muda o preço enquanto o cliente monta o carrinho:** vale o preço do banco no envio, e vendas antigas não mudam. Teste SQL na Task 3 (`total usa preço do banco, não o enviado`).
4. **Balconista desativado com sessão aberta:** perde o acesso na próxima ação. Teste SQL na Task 4 (`perfil inativo não altera status`).
5. **Nome de cliente ou observação com `<script>`, aspas, `;` ou acentos:** aparece como texto, e o CSV não quebra colunas. Teste na Task 11 (`csv escapa ponto e vírgula e quebra de linha`). O React já escapa HTML; não usar `dangerouslySetInnerHTML`.

---

## Estrutura de arquivos

```
legado/index.html                 app antigo, intocado
index.html                        entrada do Vite
vite.config.ts                    base /sabor-de-pastel/, Vitest
.github/workflows/deploy.yml      build + Pages
.env.example                      VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
supabase/migrations/0001_schema.sql      tabelas, tipos, contador do dia
supabase/migrations/0002_funcoes.sql     criar_pedido, obter_pedido_cliente, alterar_status, email_do_usuario, papel_atual
supabase/migrations/0003_rls.sql         políticas
supabase/migrations/0004_log.sql         triggers de log e broadcast de status
supabase/seed.sql                        cardápio inicial (8 itens do app antigo)
supabase/tests/*.sql                     testes de acesso e regras (rodam no SQL Editor)
src/domain/tipos.ts               tipos compartilhados
src/domain/pedido.ts              preço, total, status, rótulos, BRL
src/domain/resumo.ts              resumo do dia e CSV
src/services/supabase.ts          cliente Supabase
src/services/erros.ts             erro do banco → mensagem em português
src/services/{produtos,pedidos,log,auth}.ts
src/styles/tema.css               tokens de cor, fonte, espaçamento
src/components/                   Botao, Card, Chip, Modal, Toast, StatusBadge, Quantidade
src/auth/                         AuthProvider, RequireAuth, LoginPage
src/features/cliente/             CardapioPage, carrinho.ts, AcompanharPage
src/features/atendente/           AtendenteLayout, NovoPedido, Pedidos, Resumo, Cardapio, Log
src/App.tsx, src/main.tsx         rotas
```

## Calendário

| Data | Tasks |
|---|---|
| 14/11 | 1, 2 |
| 15/11 | 3 |
| 16/11 | 4 |
| 17/11 | 5 |
| 18/11 | 6, 7 |
| 19/11 | 8 |
| 20/11 | 9 |
| 21/11 | 10 (versão usável publicada; começa o uso real) |
| 22/11 | 11 |
| 23/11 | 12 |
| 24/11 | 13 |
| 21–27/11 | 14 (uso real, correções, relatório) |
| 28/11 | Entrega |

---

### Task 1: Projeto Vite e publicação automática

**Files:**
- Move: `index.html` → `legado/index.html`
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `.env.example`, `.gitignore`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `npm run dev`, `npm test`, `npm run build`; publicação em `https://ecm1921.github.io/sabor-de-pastel/` a cada push na `main`.

- [ ] **Step 1:** `git mv index.html legado/index.html`. Criar o projeto com `npm create vite@5 . -- --template react-ts` (sem sobrescrever `legado/` e `docs/`). Instalar `react-router-dom@6`, `@supabase/supabase-js@2`, e como dev `vitest@2`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Fixar as versões exatas no `package.json`.
- [ ] **Step 2: Teste que falha.** `src/App.test.tsx`: `renderiza o nome da pastelaria` → `expect(screen.getByText(/Sabor de Pastel/)).toBeInTheDocument()`.
- [ ] **Step 3:** `npm test` → FAIL.
- [ ] **Step 4:** `App.tsx` com `HashRouter` e uma rota `/` mostrando "Sabor de Pastel". `vite.config.ts` com `base: "/sabor-de-pastel/"` e `test: { environment: "jsdom", setupFiles: "src/setupTests.ts" }`.
- [ ] **Step 5:** `npm test` → PASS. `npm run build` → cria `dist/index.html` sem erro.
- [ ] **Step 6:** `deploy.yml`: em push na `main`, `npm ci`, `npm test -- --run`, `npm run build` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` vindos de `secrets`, e publica `dist/` com `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`. Copiar `legado/` para `dist/legado/` no build.
- [ ] **Step 7 (ação do Eduardo):** no GitHub, Settings → Pages → Source: "GitHub Actions".
- [ ] **Step 8:** commit `chore: projeto Vite e deploy no GitHub Pages`. Depois do push, abrir o link e ver "Sabor de Pastel". O app antigo continua em `/sabor-de-pastel/legado/`.

### Task 2: Regras de domínio (puras e testadas)

**Files:**
- Create: `src/domain/tipos.ts`, `src/domain/pedido.ts`
- Test: `src/domain/pedido.test.ts`

**Interfaces:**
- Produces (`tipos.ts`): `Tipo = "Retirada" | "Entrega"`, `Pagamento = "Dinheiro" | "Pix" | "Cartão"`, `Categoria = "Pastéis" | "Bebidas" | "Outros"`, `Status = "recebido" | "preparando" | "pronto" | "entregue" | "cancelado"`, `Tamanho = "M" | "G"`, `Papel = "admin" | "balconista"`, `Produto { id: string; nome: string; categoria: Categoria; preco: number | null; preco_m: number | null; preco_g: number | null; ativo: boolean }`, `ItemCarrinho { produtoId: string; tamanho: Tamanho | null; quantidade: number }`.
- Produces (`pedido.ts`): `precoUnitario(p: Produto, t: Tamanho | null): number`, `calcularTotal(itens: { precoUnitario: number; quantidade: number }[]): number`, `proximosStatus(s: Status): Status[]`, `rotuloStatus(s: Status, tipo: Tipo): string`, `formatarBRL(v: number): string`.

- [ ] **Step 1: Testes que falham**, com os valores da spec:
  - `pastel usa preço do tamanho`: Pastel com `preco_m: 15, preco_g: 25` → `precoUnitario(p, "M") === 15`, `"G" === 25`.
  - `pastel sem tamanho lança erro` e `bebida com tamanho lança erro`.
  - `total soma sem erro de centavos`: `[{precoUnitario: 0.1, quantidade: 3}]` → `0.3`.
  - `transições`: `proximosStatus("recebido")` = `["preparando","cancelado"]`; `"preparando"` = `["pronto","cancelado"]`; `"pronto"` = `["entregue"]`; `"entregue"` e `"cancelado"` = `[]`.
  - `rótulo de pronto depende do tipo`: `rotuloStatus("pronto","Retirada") === "Pronto"`, `rotuloStatus("pronto","Entrega") === "Saiu para entrega"`.
  - `formata reais`: `formatarBRL(15)` corresponde a `/R\$\s15,00/`.
- [ ] **Step 2:** `npx vitest run src/domain` → FAIL.
- [ ] **Step 3:** implementar. O total é calculado em centavos inteiros (`Math.round(v * 100)`) e dividido por 100 no fim.
- [ ] **Step 4:** `npx vitest run src/domain` → PASS.
- [ ] **Step 5:** commit `feat: regras de preço, total e status`.

### Task 3: Banco: tabelas, cardápio inicial e criação de pedido

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_funcoes.sql` (só `criar_pedido` nesta task), `supabase/seed.sql`, `supabase/tests/01_criar_pedido.sql`

**Interfaces:**
- Produces (tabelas, colunas da spec seção 5): `perfis(id uuid pk references auth.users, usuario text unique not null, nome text not null, papel text check in ('admin','balconista'), ativo boolean default true)`; `produtos(...)`; `pedidos(id uuid default gen_random_uuid(), numero int, dia date default (now() at time zone 'America/Sao_Paulo')::date, cliente text, tipo text, pagamento text, observacao text, status text default 'recebido', total numeric(10,2), criado_em timestamptz default now(), atualizado_por uuid references perfis)`; `itens_pedido(..., produto_id references produtos on delete restrict, nome_snapshot, tamanho, quantidade int check between 1 and 50, preco_unitario numeric(10,2))`; `log_acoes(...)`; `contador_dia(dia date pk, ultimo int)`. Checks nas colunas de texto com os valores das Global Constraints.
- Produces (função): `criar_pedido(p_tipo text, p_pagamento text, p_cliente text, p_observacao text, p_itens jsonb) returns table(id uuid, numero int)`, `security definer`, `execute` para `anon` e `authenticated`. `p_itens` = `[{"produto_id": "...", "tamanho": "M"|null, "quantidade": 2}]`. Erros com `raise exception` e mensagens fixas: `ITENS_VAZIOS`, `ITEM_INDISPONIVEL:<nome>`, `TAMANHO_INVALIDO:<nome>`, `QUANTIDADE_INVALIDA`.

- [ ] **Step 1 (ação do Eduardo):** criar dois projetos no supabase.com (região São Paulo): `sabor-de-pastel-teste` e `sabor-de-pastel` (produção), conforme a spec seção 12. Todos os testes SQL rodam no de teste. As migrations são aplicadas nos dois. A URL e a chave `anon` do de teste vão para `.env.local` (que fica no `.gitignore`). As de produção vão para os secrets do GitHub.
- [ ] **Step 2: Testes que falham** em `01_criar_pedido.sql`, cada caso num bloco `do $$ ... $$` dentro de `begin; ... rollback;`, que lança `exception` se a condição falhar e termina com `select 'OK'`:
  - `cria pedido com numero 1 no dia e status recebido`.
  - `segundo pedido no mesmo dia recebe numero 2`.
  - `total usa preço do banco, não o enviado`: 2 × Pastel M (15) + 1 Bebida (10) → `total = 40.00`.
  - `item inativo é recusado` → mensagem começa com `ITEM_INDISPONIVEL:`.
  - `pastel sem tamanho é recusado` → `TAMANHO_INVALIDO:`.
  - `lista vazia é recusada` → `ITENS_VAZIOS`.
- [ ] **Step 3:** rodar no SQL Editor → erro (função não existe).
- [ ] **Step 4:** escrever `0001_schema.sql`, `seed.sql` (os 8 itens do app antigo com os mesmos preços) e `criar_pedido`. Numeração: `insert into contador_dia ... on conflict (dia) do update set ultimo = contador_dia.ultimo + 1 returning ultimo`, o que é atômico. Pedido e itens no mesmo comando da função (tudo ou nada). `atualizado_por = auth.uid()` (nulo para visitante).
- [ ] **Step 5:** aplicar as migrations e rodar o teste → `OK`.
- [ ] **Step 6:** commit `feat(db): tabelas, cardápio inicial e criar_pedido`.

### Task 4: Permissões (RLS), login por usuário e leitura do pedido pelo cliente

**Files:**
- Create: `supabase/migrations/0003_rls.sql`; add to `0002_funcoes.sql`: `papel_atual`, `email_do_usuario`, `obter_pedido_cliente`
- Test: `supabase/tests/02_acesso.sql`

**Interfaces:**
- Produces: `papel_atual() returns text` (papel do perfil ativo de `auth.uid()`, ou nulo); `email_do_usuario(p_usuario text) returns text` (`security definer`, `anon`; nulo se não existir ou inativo); `obter_pedido_cliente(p_id uuid) returns jsonb` com `{numero, tipo, status, total, criado_em, itens:[{nome, tamanho, quantidade, preco_unitario}]}` (`security definer`, `anon`).
- Políticas (spec seção 6): `produtos` select para anon só `ativo`; select total para quem tem papel; insert/update/delete só `papel_atual() = 'admin'`. `pedidos` e `itens_pedido` select só com papel; sem insert direto (só via `criar_pedido`); update de status só via `alterar_status` (Task 5). `log_acoes` select só admin, sem insert/update/delete pelo cliente. `perfis` select do próprio registro, e admin vê todos.

- [ ] **Step 1: Testes que falham** em `02_acesso.sql`, simulando cada papel com `set local role anon|authenticated` e `set local request.jwt.claims = '{"sub":"<uuid>"}'`:
  - `visitante não lista pedidos` (select retorna 0 linhas).
  - `visitante não vê produto inativo`.
  - `visitante não insere pedido direto na tabela` (erro de permissão).
  - `visitante lê o próprio pedido pelo id` via `obter_pedido_cliente`.
  - `balconista não edita produto` e `balconista não lê log`.
  - `admin edita produto e lê log`.
  - `perfil inativo não lê pedidos`.
  - `email_do_usuario devolve só o e-mail pedido` e devolve nulo para usuário inexistente.
- [ ] **Step 2:** rodar → falhas.
- [ ] **Step 3:** escrever `0003_rls.sql` e as três funções.
- [ ] **Step 4:** rodar → `OK` em todos.
- [ ] **Step 5:** commit `feat(db): RLS, login por usuário e consulta do cliente`.

### Task 5: Mudança de status, log e aviso em tempo real

**Files:**
- Create: `supabase/migrations/0004_log.sql`; add `alterar_status` to `0002_funcoes.sql`
- Test: `supabase/tests/03_status_log.sql`

**Interfaces:**
- Produces: `alterar_status(p_pedido uuid, p_novo text) returns void` (só papel ativo; valida a mesma tabela de transições da Task 2; erro `TRANSICAO_INVALIDA` ou `SEM_PERMISSAO`; grava `atualizado_por`).
- Triggers `after insert or update or delete` em `produtos` e `after insert or update of status` em `pedidos` gravam em `log_acoes` com `perfil_id = auth.uid()`, `acao` da lista da spec (`preco_alterado` quando muda `preco`, `preco_m` ou `preco_g`; `pedido_cancelado` quando o novo status é `cancelado`), `detalhes = jsonb_build_object('antes', to_jsonb(old), 'depois', to_jsonb(new))`.
- Trigger em `pedidos` após update de status chama `realtime.send(jsonb_build_object('status', new.status), 'status', 'pedido:' || new.id, false)`. O cliente escuta esse canal (Task 6).
- Habilitar a publicação `supabase_realtime` para `pedidos` (o atendente escuta mudanças da tabela).

- [ ] **Step 1: Testes que falham:**
  - `balconista aceita pedido`: `recebido→preparando` funciona e o log tem `status_alterado` com o `perfil_id` dele.
  - `perfil inativo não altera status` → `SEM_PERMISSAO`.
  - `não volta de status`: `pronto→preparando` → `TRANSICAO_INVALIDA`.
  - `cancelar grava pedido_cancelado`.
  - `admin muda preço grava preco_alterado com antes e depois`.
  - `visitante não chama alterar_status`.
- [ ] **Step 2:** rodar → falhas.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** rodar → `OK`.
- [ ] **Step 5:** commit `feat(db): status, log de ações e aviso em tempo real`.

### Task 6: Camada de serviços

**Files:**
- Create: `src/services/supabase.ts`, `src/services/erros.ts`, `src/services/produtos.ts`, `src/services/pedidos.ts`, `src/services/log.ts`, `src/services/auth.ts`
- Test: `src/services/erros.test.ts`, `src/services/pedidos.test.ts`

**Interfaces:**
- Consumes: funções SQL das Tasks 3 a 5; tipos da Task 2.
- Produces:
  - `produtos.ts`: `listarCardapio(): Promise<Produto[]>` (só ativos), `listarProdutos(): Promise<Produto[]>`, `salvarProduto(p: Omit<Produto,"id"> & { id?: string }): Promise<Produto>`, `definirAtivo(id: string, ativo: boolean): Promise<void>`, `excluirProduto(id: string): Promise<"excluido" | "desativado">` (se o banco recusar por FK `23503`, marca inativo e devolve `"desativado"`).
  - `pedidos.ts`: `criarPedido(input: { tipo: Tipo; pagamento: Pagamento; cliente: string; observacao: string; itens: ItemCarrinho[] }): Promise<{ id: string; numero: number }>`, `obterPedidoCliente(id: string): Promise<PedidoCliente | null>`, `listarPedidosDoDia(dia: string): Promise<Pedido[]>`, `alterarStatus(id: string, novo: Status): Promise<void>`, `assinarPedidosDoDia(dia: string, aoMudar: () => void): () => void`, `assinarStatusDoPedido(id: string, aoMudar: (s: Status) => void): () => void` (canal de broadcast `pedido:<id>`, mais consulta a cada 15 s como reserva).
  - `log.ts`: `listarLog(f: { dia?: string; perfilId?: string }): Promise<LogAcao[]>`.
  - `auth.ts`: `entrar(usuario: string, senha: string): Promise<Perfil>`, `sair(): Promise<void>`, `recuperarSenha(usuario: string): Promise<void>`, `perfilAtual(): Promise<Perfil | null>`.
  - `erros.ts`: `mensagemDeErro(e: unknown): string`.
  - Tipos novos em `tipos.ts`: `Pedido`, `PedidoCliente`, `LogAcao`, `Perfil { id; usuario; nome; papel: Papel }`.

- [ ] **Step 1: Testes que falham** (`erros.test.ts`):
  - `ITEM_INDISPONIVEL:Pastel de Carne` → `"Pastel de Carne acabou. Tire do carrinho e tente de novo."`
  - `TRANSICAO_INVALIDA` → `"Esse pedido já mudou de situação. Atualize a lista."`
  - `SEM_PERMISSAO` → `"Você não tem permissão para isso."`
  - `Invalid login credentials` → `"Usuário ou senha incorretos."`
  - `TypeError: Failed to fetch` → `"Sem conexão. Tente de novo."`
  - qualquer outro → `"Algo deu errado. Tente de novo."` (nunca mostra a mensagem do banco)
- [ ] **Step 2:** `pedidos.test.ts`: `criarPedido envia itens no formato do banco` com o cliente Supabase simulado (`vi.mock`) → `rpc` chamado com `"criar_pedido"` e `p_itens: [{produto_id, tamanho, quantidade}]`.
- [ ] **Step 3:** `npx vitest run src/services` → FAIL.
- [ ] **Step 4:** implementar. `entrar` chama `email_do_usuario` e depois `signInWithPassword`. Se o e-mail vier nulo, lança o mesmo erro de senha incorreta, para não revelar quais usuários existem. `recuperarSenha` usa `resetPasswordForEmail` com `redirectTo` para `/#/atendente/nova-senha`.
- [ ] **Step 5:** `npx vitest run` → PASS.
- [ ] **Step 6:** commit `feat: serviços de dados e mensagens de erro`.

### Task 7: Identidade visual e componentes base

**Files:**
- Create: `src/styles/tema.css`, `src/components/{Botao,Card,Chip,Modal,Toast,StatusBadge,Quantidade}.tsx`
- Test: `src/components/StatusBadge.test.tsx`, `src/components/Quantidade.test.tsx`

**Interfaces:**
- Produces: `<Botao variante="primario"|"secundario"|"perigo" carregando?>`, `<Card>`, `<Chip ativo onClick>`, `<Modal aberto aoFechar titulo>`, `useToast(): (msg: string) => void` com `<ToastProvider>`, `<StatusBadge status tipo>` (usa `rotuloStatus`), `<Quantidade valor aoMudar min=0 max=50 rotulo>`.

- [ ] **Step 1:** usar a skill `frontend-design:frontend-design` para fechar a direção da spec seção 10: preto `#141414`, amarelo `#ffc914`, creme `#f6f5f0` e um dourado queimado de destaque; uma fonte display com personalidade para títulos e uma fonte de texto legível (Google Fonts); cor própria para cada status, legível de longe.
- [ ] **Step 2: Testes que falham:** `StatusBadge mostra "Saiu para entrega" para pronto em Entrega`; `Quantidade não passa de 50 nem fica abaixo de 0`; `botões de Quantidade têm aria-label "Diminuir"/"Aumentar" e rótulo do produto`.
- [ ] **Step 3:** rodar → FAIL. Implementar. Rodar → PASS.
- [ ] **Step 4:** conferir no navegador com 360px de largura: sem rolagem lateral, botões com pelo menos 44px.
- [ ] **Step 5:** commit `feat: identidade visual e componentes`.

### Task 8: Login e rotas protegidas

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/RequireAuth.tsx`, `src/auth/LoginPage.tsx`, `src/auth/NovaSenhaPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/auth/RequireAuth.test.tsx`

**Interfaces:**
- Consumes: `entrar`, `sair`, `perfilAtual`, `recuperarSenha` (Task 6).
- Produces: `useAuth(): { perfil: Perfil | null; carregando: boolean; entrar; sair }`; `<RequireAuth papel?: Papel>`; rotas `/#/atendente/login`, `/#/atendente/nova-senha`, `/#/atendente/*` protegida.

- [ ] **Step 1: Testes que falham:** `sem sessão redireciona para o login`; `balconista em rota de admin vê "Você não tem permissão para isso."`; `admin entra na rota de admin`.
- [ ] **Step 2:** rodar → FAIL. Implementar. A tela de login tem os campos Usuário e Senha, o botão Entrar e o link "Esqueci minha senha", que pede o usuário e mostra "Se o usuário existir, enviamos um link para o e-mail cadastrado." Rodar → PASS.
- [ ] **Step 3 (ação do Eduardo):** criar no painel do Supabase a conta do admin e a de cada balconista (e-mail de cada um), e rodar para cada uma: `insert into perfis (id, usuario, nome, papel) values ('<id do Auth>', '<usuario>', '<Nome>', 'admin'|'balconista');`
- [ ] **Step 4:** testar no navegador: entrar com um usuário, recarregar a página e continuar logado; sair.
- [ ] **Step 5:** commit `feat: login por usuário e rotas protegidas`.

### Task 9: Atendente: novo pedido e fila de pedidos em tempo real

**Files:**
- Create: `src/features/cliente/carrinho.ts`, `src/features/atendente/AtendenteLayout.tsx`, `NovoPedido.tsx`, `Pedidos.tsx`, `som.ts`
- Test: `src/features/cliente/carrinho.test.ts`, `src/features/atendente/Pedidos.test.tsx`

**Interfaces:**
- Consumes: `listarCardapio`, `criarPedido`, `listarPedidosDoDia`, `alterarStatus`, `assinarPedidosDoDia`, `proximosStatus`, `rotuloStatus`, componentes da Task 7.
- Produces: `carrinhoReducer(estado: Record<string, ItemCarrinho>, acao: { tipo: "mais" | "menos"; produtoId: string; tamanho: Tamanho | null } | { tipo: "limpar" })`, chave `"<produtoId>|<tamanho ou vazio>"`; `itensDoCarrinho(estado): ItemCarrinho[]` (usado também pela Task 10). Abas Novo pedido, Pedidos e Resumo (Task 11) para todos; Cardápio e Log (Task 12) só para admin. `tocarAviso(): void` (bip curto com Web Audio, sem arquivo).

- [ ] **Step 1: Testes que falham:**
  - `carrinho: mais e menos alteram a quantidade e remove o item no zero`; `limpar esvazia`.
  - `pedido recebido mostra o botão "Aceitar"`, que chama `alterarStatus(id, "preparando")`.
  - `pedido preparando de Entrega mostra "Saiu para entrega"`, e o de Retirada mostra "Pronto".
  - `pedido pronto mostra "Entregue"`.
  - `cancelar pede confirmação antes de chamar alterarStatus(id, "cancelado")`.
  - `pedido novo vindo do tempo real toca aviso e fica destacado`.
- [ ] **Step 2:** rodar → FAIL. Implementar. Filtros: Todos, Novos, Em andamento, Concluídos. Os botões de status seguem `proximosStatus`. Rodar → PASS.
- [ ] **Step 3:** teste com dois navegadores: um pedido feito em um aparece no outro em menos de 3 s.
- [ ] **Step 4:** commit `feat: atendente com novo pedido e fila em tempo real`.

### Task 10: Cliente: cardápio, envio e acompanhamento (versão usável)

**Files:**
- Create: `src/features/cliente/CardapioPage.tsx`, `AcompanharPage.tsx`
- Test: `src/features/cliente/CardapioPage.test.tsx`

**Interfaces:**
- Consumes: `carrinhoReducer`, `itensDoCarrinho` (Task 9); `listarCardapio`, `criarPedido`, `obterPedidoCliente`, `assinarStatusDoPedido` (Task 6).
- Produces: rotas `/#/` e `/#/pedido/:id`. Chave no `localStorage`: `sabor.meusPedidos` (lista de ids, sempre com `try/catch`).

- [ ] **Step 1: Testes que falham:**
  - `envia uma vez mesmo com dois cliques`: dois cliques rápidos em "Enviar pedido" → `criarPedido` chamado 1 vez.
  - `campo armadilha preenchido não envia`: o campo invisível `site` preenchido → `criarPedido` não é chamado, mas a tela mostra o sucesso normalmente.
  - `erro de item esgotado mantém o carrinho e mostra a mensagem`.
  - `após enviar, vai para /pedido/:id e guarda o id`.
- [ ] **Step 2:** rodar → FAIL. Implementar. Cardápio por categoria, M/G nos pastéis, carrinho fixo embaixo com total, formulário com nome (opcional), Retirada/Entrega, pagamento e observação. A tela de acompanhamento mostra número, itens, total e uma linha do tempo com os rótulos do tipo. O status muda sozinho por `assinarStatusDoPedido`. Rodar → PASS.
- [ ] **Step 3:** publicar (push). No celular, fazer um pedido, aceitar no computador e ver "Preparando" aparecer no celular sem recarregar.
- [ ] **Step 4:** commit `feat: área do cliente com pedido e acompanhamento`. **A partir daqui a pastelaria já pode usar o app (21/11).**

### Task 11: Resumo do dia e exportação CSV

**Files:**
- Create: `src/domain/resumo.ts`, `src/features/atendente/Resumo.tsx`
- Test: `src/domain/resumo.test.ts`

**Interfaces:**
- Produces: `resumirDia(pedidos: Pedido[]): { total; quantidade; ticketMedio; pasteis; cancelados; porPagamento: Record<Pagamento, { quantidade; valor }>; maisVendidos: { nome: string; quantidade: number }[] }`; `gerarCsv(pedidos: Pedido[]): string` com o cabeçalho `pedido;data;hora;cliente;tipo;pagamento;status;itens;total`.

- [ ] **Step 1: Testes que falham:** `cancelados não entram no total mas são contados`; `ticket médio é zero sem pedidos`; `mais vendidos em ordem decrescente`; `csv escapa ponto e vírgula e quebra de linha` (cliente `"Ana; mesa\n2"` vira um campo só, entre aspas); `csv usa vírgula decimal` (`40,00`).
- [ ] **Step 2:** rodar → FAIL. Implementar. A tela tem seletor de dia, os indicadores do app antigo e o botão "Copiar vendas do dia". Rodar → PASS.
- [ ] **Step 3:** commit `feat: resumo do dia e CSV`.

### Task 12: Admin: cardápio e log

**Files:**
- Create: `src/features/atendente/Cardapio.tsx`, `src/features/atendente/Log.tsx`
- Test: `src/features/atendente/Cardapio.test.tsx`, `src/features/atendente/Log.test.tsx`

**Interfaces:**
- Consumes: `listarProdutos`, `salvarProduto`, `definirAtivo`, `excluirProduto`, `listarLog`.

- [ ] **Step 1: Testes que falham:** `Pastel mostra campos M e G; Bebida mostra um preço`; `aceita preço com vírgula` (`"12,50"` → `12.5`); `excluir produto já vendido avisa "Item desativado porque já tem vendas"`; `log filtra por usuário e dia e mostra quem, quando e o quê` (por exemplo, "joao alterou o preço de Pastel de Carne: M R$ 15,00 → R$ 16,00").
- [ ] **Step 2:** rodar → FAIL. Implementar. Rodar → PASS.
- [ ] **Step 3:** entrar como balconista e confirmar que as abas Cardápio e Log não aparecem.
- [ ] **Step 4:** commit `feat: cardápio e log para o admin`.

### Task 13: README e roteiro de teste

**Files:**
- Create: `README.md`, `docs/roteiro-de-teste.md`, `docs/prints/` (imagens)

- [ ] **Step 1:** README com: o problema da pastelaria e a solução; prints de cliente, atendente e log; link do app; tecnologias; como rodar (`.env.local`, migrations, seed); como criar contas (o SQL da Task 8); como funcionam as regras de acesso (tabela da spec seção 6); testes (`npm test` e `supabase/tests`); ODS **meta 8.3**; contexto do Projeto de Extensão III.
- [ ] **Step 2:** `docs/roteiro-de-teste.md` com os 10 passos da spec seção 11, cada um com o resultado esperado e um campo "ok / problema".
- [ ] **Step 3:** `npm test -- --run` e todos os `supabase/tests/*.sql` → tudo PASS / `OK`.
- [ ] **Step 4:** commit `docs: README e roteiro de teste`.

### Task 14: Semana de uso real (21 a 27/11)

- [ ] Usar o app na pastelaria todos os dias e anotar cada problema no roteiro (data, o que aconteceu, quem viu).
- [ ] Corrigir os problemas encontrados, um commit por correção, com teste quando for bug.
- [ ] Coletar o depoimento e fotos de uso para o relatório.
- [ ] 27/11: conferir os critérios de sucesso da spec seção 13, um por um.
- [ ] Acessar o projeto no Supabase pelo menos uma vez por semana, para ele não ser pausado.
