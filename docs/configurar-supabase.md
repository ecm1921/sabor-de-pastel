# Configurar o Supabase e a publicação

Passo a passo para colocar o app no ar. Leva uns 20 minutos e é feito uma única vez.

## 1. Criar os dois projetos

1. Entre em https://supabase.com e crie uma conta (pode usar a do GitHub).
2. Crie o projeto **sabor-de-pastel-teste**, na região **South America (São Paulo)**. Guarde a senha do banco.
3. Crie o projeto **sabor-de-pastel**, na mesma região. Ele é o de produção, usado pela pastelaria.

Os passos 2 a 4 abaixo são feitos **nos dois projetos**.

## 2. Criar o banco

No projeto, abra **SQL Editor → New query**. Cole o conteúdo de cada arquivo abaixo, **nesta ordem**, e clique em **Run** em cada um:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_funcoes.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_log.sql`
5. `supabase/migrations/0005_grants.sql`
6. `supabase/seed.sql` (cardápio inicial)

Depois, só no projeto de **teste**, rode os arquivos de `supabase/tests/` (o `01`, o `02` e o `03`). O resultado de cada um tem que ser `OK`. Não rode a pasta `supabase/tests/_local`, que é só para o computador.

## 3. Conferir o tempo real

Abra **Database → Publications** e confira se a tabela `pedidos` está marcada em `supabase_realtime`. Se não estiver, marque.

## 4. Criar as contas da equipe

Primeiro, desligue o cadastro público: em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up** e clique em **Save**. Assim só você cria contas. O botão **Add user** continua funcionando.

Para cada pessoa (admin e cada balconista):

1. Abra **Authentication → Users → Add user → Create new user**.
2. Informe o **e-mail** da pessoa e uma **senha** (pelo menos 8 caracteres). Marque **Auto Confirm User**.
3. Copie o **UID** do usuário criado.
4. No **SQL Editor**, rode trocando os valores:

```sql
insert into perfis (id, usuario, nome, papel)
values ('COLE-O-UID-AQUI', 'joao', 'João', 'balconista');
```

- `usuario`: o que a pessoa digita no login. Use só letras minúsculas, números, ponto, traço ou sublinhado (de 3 a 30 caracteres).
- `papel`: `admin` ou `balconista`.

Para tirar o acesso de alguém: `update perfis set ativo = false where usuario = 'joao';`

**Link de recuperação de senha** (para funcionar mesmo se a pessoa abrir o e-mail em outro aparelho):

1. Em **Authentication → URL Configuration**, coloque `https://ecm1921.github.io/sabor-de-pastel/` em **Site URL** e em **Redirect URLs**.
2. Em **Authentication → Emails → Reset Password**, troque o link do modelo por:

```html
<a href="{{ .SiteURL }}?token_hash={{ .TokenHash }}&type=recovery">Criar nova senha</a>
```

## 5. Ligar o app ao Supabase

Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**. Nunca use a chave `service_role` no app.

- **No computador (projeto de teste):** crie o arquivo `.env.local` com base no `.env.example`.
- **No GitHub (projeto de produção):** no repositório, abra **Settings → Secrets and variables → Actions → New repository secret** e crie:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_WHATSAPP_LOJA` = `5531975423850`

## 6. Ativar o GitHub Pages

No repositório, abra **Settings → Pages → Build and deployment → Source** e escolha **GitHub Actions**. A cada envio para a branch `main`, o app é testado e publicado sozinho.

## 7. Manter o projeto ativo

No plano gratuito, o Supabase pausa projetos sem uso por cerca de uma semana. Use o app ou abra o painel pelo menos uma vez por semana.
