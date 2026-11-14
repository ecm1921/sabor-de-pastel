-- Testes de permissão: o que visitante, balconista, admin e perfil inativo conseguem fazer.
-- Rodam dentro de uma transação desfeita no fim. Falha = erro começando com "FALHOU [caso]".
begin;

create function pg_temp.espera_erro(cmd text, prefixo text, caso text) returns void language plpgsql as $$
begin
  execute cmd;
  raise exception 'FALHOU [%]: nenhum erro', caso;
exception when others then
  if sqlerrm like 'FALHOU%' then raise; end if;
  if sqlerrm not like prefixo || '%' then
    raise exception 'FALHOU [%]: esperado %, veio %', caso, prefixo, sqlerrm;
  end if;
end $$;
grant execute on function pg_temp.espera_erro(text, text, text) to anon, authenticated;

-- Pessoas: admin (…01), balconista (…02), balconista desativado (…03).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'admin@teste.local'),
  ('00000000-0000-0000-0000-000000000002', 'joao@teste.local'),
  ('00000000-0000-0000-0000-000000000003', 'saiu@teste.local');
insert into perfis (id, usuario, nome, papel, ativo) values
  ('00000000-0000-0000-0000-000000000001', 'admin.teste', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'joao.teste', 'João', 'balconista', true),
  ('00000000-0000-0000-0000-000000000003', 'saiu.teste', 'Saiu', 'balconista', false);

insert into produtos (id, nome, categoria, preco, preco_m, preco_g, ativo) values
  ('00000000-0000-0000-0000-0000000000b1', 'Pastel Ativo',   'Pastéis', null, 15, 25, true),
  ('00000000-0000-0000-0000-0000000000b2', 'Pastel Inativo', 'Pastéis', null, 15, 25, false);
insert into log_acoes (acao, entidade, entidade_id) values ('produto_criado', 'produtos', 'x');

-- Um pedido feito pelo visitante; o id fica guardado para os testes seguintes.
set local role anon;
select set_config('teste.pedido', (criar_pedido('Retirada', 'Pix', 'Ana', '', '31975423850', null,
  '[{"produto_id":"00000000-0000-0000-0000-0000000000b1","tamanho":"G","quantidade":2}]')).id::text, true);
reset role;

-------------------------------------------------------------- visitante
set local role anon;
set local request.jwt.claims = '{}';
do $$
declare j jsonb;
begin
  if exists (select 1 from produtos where not ativo) then raise exception 'FALHOU [visitante não vê produto inativo]'; end if;
  if not exists (select 1 from produtos where ativo) then raise exception 'FALHOU [visitante vê produto ativo]'; end if;

  j := obter_pedido_cliente(current_setting('teste.pedido')::uuid);
  if j is null or j ->> 'status' <> 'recebido' or (j ->> 'total')::numeric <> 50
     or j ->> 'telefone' <> '31975423850' or jsonb_array_length(j -> 'itens') <> 1
     or j -> 'itens' -> 0 ->> 'nome' <> 'Pastel Ativo' or j -> 'endereco' <> 'null'::jsonb then
    raise exception 'FALHOU [visitante lê o próprio pedido pelo id]: %', j;
  end if;
  if obter_pedido_cliente(gen_random_uuid()) is not null then
    raise exception 'FALHOU [id inexistente devolve nulo]';
  end if;

  if email_do_usuario('joao.teste') <> 'joao@teste.local' then
    raise exception 'FALHOU [email_do_usuario devolve só o e-mail pedido]';
  end if;
  if email_do_usuario('ninguem') is not null then raise exception 'FALHOU [usuário inexistente devolve nulo]'; end if;
  if email_do_usuario('saiu.teste') is not null then raise exception 'FALHOU [usuário inativo devolve nulo]'; end if;
end $$;
select pg_temp.espera_erro($q$ select count(*) from pedidos $q$, 'permission denied', 'visitante não lista pedidos');
select pg_temp.espera_erro($q$ select count(*) from itens_pedido $q$, 'permission denied', 'visitante não lista itens');
select pg_temp.espera_erro($q$ select count(*) from log_acoes $q$, 'permission denied', 'visitante não lê log');
select pg_temp.espera_erro($q$ select count(*) from perfis $q$, 'permission denied', 'visitante não lê perfis');
select pg_temp.espera_erro($q$ select count(*) from contador_dia $q$, 'permission denied', 'visitante não lê contador');
select pg_temp.espera_erro(
  $q$ insert into pedidos (numero, tipo, pagamento, telefone) values (99, 'Retirada', 'Pix', '31975423850') $q$,
  'permission denied', 'visitante não insere pedido direto na tabela');
select pg_temp.espera_erro(
  $q$ insert into produtos (nome, categoria, preco) values ('Hack', 'Outros', 1) $q$,
  'permission denied', 'visitante não cria produto');
reset role;

-------------------------------------------------------------- balconista
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002"}';
do $$
declare n int;
begin
  if papel_atual() <> 'balconista' then raise exception 'FALHOU [papel do balconista]'; end if;
  if (select count(*) from pedidos) <> 1 then raise exception 'FALHOU [balconista lê pedidos]'; end if;
  if (select count(*) from itens_pedido) <> 1 then raise exception 'FALHOU [balconista lê itens]'; end if;
  if not exists (select 1 from produtos where not ativo) then raise exception 'FALHOU [balconista vê produto inativo]'; end if;
  if (select count(*) from log_acoes) <> 0 then raise exception 'FALHOU [balconista não lê log]'; end if;
  if (select count(*) from perfis) <> 1 then raise exception 'FALHOU [balconista só vê o próprio perfil]'; end if;

  update produtos set preco_m = 99 where id = '00000000-0000-0000-0000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU [balconista não edita produto]'; end if;
  delete from produtos where id = '00000000-0000-0000-0000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU [balconista não exclui produto]'; end if;
end $$;
select pg_temp.espera_erro($q$ update pedidos set status = 'entregue' $q$, 'permission denied',
  'balconista não altera pedido direto na tabela');
select pg_temp.espera_erro($q$ update perfis set papel = 'admin' $q$, 'permission denied',
  'balconista não se promove a admin');
reset role;

-------------------------------------------------------------- admin
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
do $$
declare n int;
begin
  if papel_atual() <> 'admin' then raise exception 'FALHOU [papel do admin]'; end if;
  update produtos set preco_m = 16 where id = '00000000-0000-0000-0000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALHOU [admin edita produto]'; end if;
  insert into produtos (nome, categoria, preco) values ('Pastel Doce', 'Outros', 12);
  if (select count(*) from log_acoes) < 1 then raise exception 'FALHOU [admin lê log]'; end if;
  if (select count(*) from perfis) <> 3 then raise exception 'FALHOU [admin vê todos os perfis]'; end if;
end $$;
select pg_temp.espera_erro(
  $q$ insert into log_acoes (acao, entidade, entidade_id) values ('produto_criado', 'produtos', 'falso') $q$,
  'permission denied', 'ninguém escreve no log pelo app');
reset role;

-------------------------------------------------------------- perfil desativado
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003"}';
do $$
begin
  if papel_atual() is not null then raise exception 'FALHOU [perfil inativo não tem papel]'; end if;
  if (select count(*) from pedidos) <> 0 then raise exception 'FALHOU [perfil inativo não lê pedidos]'; end if;
  if exists (select 1 from produtos where not ativo) then raise exception 'FALHOU [perfil inativo vê só cardápio público]'; end if;
end $$;
reset role;

-------------------------------------------------------------- permissões nas tabelas (sem depender do padrão do Supabase)
do $$
declare
  t record;
begin
  for t in select * from (values
    -- papel, tabela, permissão, esperado
    ('anon', 'produtos', 'SELECT', true),
    ('anon', 'produtos', 'INSERT', false),
    ('anon', 'pedidos', 'SELECT', false),
    ('anon', 'pedidos', 'INSERT', false),
    ('anon', 'pedidos', 'DELETE', false),
    ('anon', 'itens_pedido', 'SELECT', false),
    ('anon', 'log_acoes', 'SELECT', false),
    ('anon', 'perfis', 'SELECT', false),
    ('anon', 'contador_dia', 'SELECT', false),
    ('authenticated', 'produtos', 'SELECT', true),
    ('authenticated', 'produtos', 'UPDATE', true),
    ('authenticated', 'pedidos', 'SELECT', true),
    ('authenticated', 'pedidos', 'UPDATE', false),
    ('authenticated', 'pedidos', 'TRUNCATE', false),
    ('authenticated', 'itens_pedido', 'SELECT', true),
    ('authenticated', 'log_acoes', 'SELECT', true),
    ('authenticated', 'log_acoes', 'INSERT', false),
    ('authenticated', 'perfis', 'SELECT', true),
    ('authenticated', 'perfis', 'UPDATE', false),
    ('authenticated', 'contador_dia', 'SELECT', false)
  ) as x(papel, tabela, permissao, esperado) loop
    if has_table_privilege(t.papel, 'public.' || t.tabela, t.permissao) <> t.esperado then
      raise exception 'FALHOU [permissão %: % em %, esperado %]', t.papel, t.permissao, t.tabela, t.esperado;
    end if;
  end loop;
end $$;

rollback;
select 'OK' as resultado;
