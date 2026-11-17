-- Sabor de Pastel v2: tabelas.
-- Regras de negócio que precisam valer sempre (preço, total, numeração, status) ficam no banco.

create table perfis (
  id      uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9._-]{3,30}$'),
  nome    text not null check (length(trim(nome)) > 0),
  papel   text not null check (papel in ('admin', 'balconista')),
  ativo   boolean not null default true
);

create table produtos (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null check (length(trim(nome)) > 0),
  categoria text not null check (categoria in ('Pastéis', 'Bebidas', 'Outros')),
  preco     numeric(10, 2) check (preco >= 0),
  preco_m   numeric(10, 2) check (preco_m >= 0),
  preco_g   numeric(10, 2) check (preco_g >= 0),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now(),
  -- Pastéis têm preço M e G; os demais têm preço único.
  check (
    (categoria = 'Pastéis' and preco_m is not null and preco_g is not null and preco is null)
    or (categoria <> 'Pastéis' and preco is not null and preco_m is null and preco_g is null)
  )
);

create table pedidos (
  id                   uuid primary key default gen_random_uuid(),
  numero               int not null,
  dia                  date not null default (now() at time zone 'America/Sao_Paulo')::date,
  cliente              text not null default '',
  tipo                 text not null check (tipo in ('Retirada', 'Entrega')),
  pagamento            text not null check (pagamento in ('Dinheiro', 'Pix', 'Cartão')),
  observacao           text not null default '',
  telefone             text not null check (telefone ~ '^[0-9]{10,11}$'),
  endereco_rua         text,
  endereco_numero      text,
  endereco_bairro      text,
  endereco_complemento text,
  endereco_referencia  text,
  status               text not null default 'recebido'
                       check (status in ('recebido', 'preparando', 'pronto', 'entregue', 'cancelado')),
  total                numeric(10, 2) not null default 0,
  criado_em            timestamptz not null default now(),
  atualizado_por       uuid references perfis (id),
  unique (dia, numero),
  -- Entrega sempre tem rua, número e bairro.
  check (tipo <> 'Entrega' or (endereco_rua <> '' and endereco_numero <> '' and endereco_bairro <> ''))
);

create table itens_pedido (
  id             uuid primary key default gen_random_uuid(),
  pedido_id      uuid not null references pedidos (id) on delete cascade,
  produto_id     uuid not null references produtos (id) on delete restrict,
  nome_snapshot  text not null,
  tamanho        text check (tamanho in ('M', 'G')),
  quantidade     int not null check (quantidade between 1 and 50),
  preco_unitario numeric(10, 2) not null
);
create index itens_pedido_pedido on itens_pedido (pedido_id);

create table log_acoes (
  id          bigint generated always as identity primary key,
  quando      timestamptz not null default now(),
  perfil_id   uuid references perfis (id),
  acao        text not null check (acao in (
                'pedido_criado', 'status_alterado', 'pedido_cancelado',
                'produto_criado', 'produto_editado', 'produto_excluido', 'preco_alterado')),
  entidade    text not null,
  entidade_id text not null,
  detalhes    jsonb not null default '{}'
);
create index log_acoes_quando on log_acoes (quando desc);

-- Último número de pedido usado em cada dia (a numeração recomeça todo dia).
create table contador_dia (
  dia    date primary key,
  ultimo int not null
);
