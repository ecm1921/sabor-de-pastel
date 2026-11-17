-- Regras de acesso (Row Level Security). Valem para qualquer acesso pela chave pública do app.
-- Resumo: visitante vê só o cardápio ativo; balconista vê pedidos e cardápio; admin vê tudo e edita o cardápio.
-- Ninguém grava pedidos, status ou log direto nas tabelas: só pelas funções do banco.

alter table perfis       enable row level security;
alter table produtos     enable row level security;
alter table pedidos      enable row level security;
alter table itens_pedido enable row level security;
alter table log_acoes    enable row level security;
alter table contador_dia enable row level security;

-- perfis: cada um vê o próprio; admin vê todos.
create policy perfis_ler on perfis for select
  using (id = auth.uid() or papel_atual() = 'admin');

-- produtos: cardápio ativo é público; equipe vê tudo; só admin altera.
create policy produtos_ler on produtos for select
  using (ativo or papel_atual() is not null);
create policy produtos_criar on produtos for insert
  with check (papel_atual() = 'admin');
create policy produtos_editar on produtos for update
  using (papel_atual() = 'admin') with check (papel_atual() = 'admin');
create policy produtos_excluir on produtos for delete
  using (papel_atual() = 'admin');

-- pedidos e itens: só a equipe lê. Criação via criar_pedido, status via alterar_status.
create policy pedidos_ler on pedidos for select
  using (papel_atual() is not null);
create policy itens_ler on itens_pedido for select
  using (papel_atual() is not null);

-- log: só admin lê; escrito apenas pelos triggers do banco.
create policy log_ler on log_acoes for select
  using (papel_atual() = 'admin');

-- contador_dia: sem políticas = ninguém acessa pelo app (só criar_pedido).
