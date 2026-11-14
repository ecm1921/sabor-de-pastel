-- Testes de mudança de status e do log de ações.
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

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000011', 'admin@teste.local'),
  ('00000000-0000-0000-0000-000000000012', 'joao@teste.local'),
  ('00000000-0000-0000-0000-000000000013', 'saiu@teste.local');
insert into perfis (id, usuario, nome, papel, ativo) values
  ('00000000-0000-0000-0000-000000000011', 'admin.teste', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-000000000012', 'joao.teste', 'João', 'balconista', true),
  ('00000000-0000-0000-0000-000000000013', 'saiu.teste', 'Saiu', 'balconista', false);
insert into produtos (id, nome, categoria, preco, preco_m, preco_g) values
  ('00000000-0000-0000-0000-0000000000c1', 'Pastel Log', 'Pastéis', null, 15, 25);

select set_config('teste.p1', (criar_pedido('Entrega', 'Pix', '', '', '31975423850',
  '{"rua":"Rua A","numero":"1","bairro":"Centro"}',
  '[{"produto_id":"00000000-0000-0000-0000-0000000000c1","tamanho":"M","quantidade":1}]')).id::text, true);
select set_config('teste.p2', (criar_pedido('Retirada', 'Pix', '', '', '31975423850', null,
  '[{"produto_id":"00000000-0000-0000-0000-0000000000c1","tamanho":"M","quantidade":1}]')).id::text, true);

do $$
begin
  if not exists (select 1 from log_acoes where acao = 'pedido_criado' and entidade_id = current_setting('teste.p1')) then
    raise exception 'FALHOU [criar pedido grava pedido_criado]';
  end if;
end $$;

-------------------------------------------------------------- visitante
set local role anon;
set local request.jwt.claims = '{}';
select pg_temp.espera_erro(
  format($q$ select alterar_status(%L, 'preparando') $q$, current_setting('teste.p1')),
  'SEM_PERMISSAO', 'visitante não chama alterar_status');
reset role;

-------------------------------------------------------------- perfil desativado
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000013"}';
select pg_temp.espera_erro(
  format($q$ select alterar_status(%L, 'preparando') $q$, current_setting('teste.p1')),
  'SEM_PERMISSAO', 'perfil inativo não altera status');
reset role;

-------------------------------------------------------------- balconista
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000012"}';
select alterar_status(current_setting('teste.p1')::uuid, 'preparando');
select alterar_status(current_setting('teste.p1')::uuid, 'pronto');
select pg_temp.espera_erro(
  format($q$ select alterar_status(%L, 'preparando') $q$, current_setting('teste.p1')),
  'TRANSICAO_INVALIDA', 'não volta de status');
select pg_temp.espera_erro(
  format($q$ select alterar_status(%L, 'cancelado') $q$, current_setting('teste.p1')),
  'TRANSICAO_INVALIDA', 'pronto não pode ser cancelado');
select pg_temp.espera_erro(
  format($q$ select alterar_status(%L, 'voando') $q$, current_setting('teste.p1')),
  'TRANSICAO_INVALIDA', 'status desconhecido é recusado');
select pg_temp.espera_erro(
  $q$ select alterar_status(gen_random_uuid(), 'preparando') $q$,
  'PEDIDO_NAO_ENCONTRADO', 'pedido inexistente é recusado');
select alterar_status(current_setting('teste.p2')::uuid, 'cancelado');
reset role;

do $$
declare p pedidos;
begin
  select * into p from pedidos where id = current_setting('teste.p1')::uuid;
  if p.status <> 'pronto' or p.atualizado_por <> '00000000-0000-0000-0000-000000000012' then
    raise exception 'FALHOU [balconista aceita pedido]: status %, por %', p.status, p.atualizado_por;
  end if;
  if (select count(*) from log_acoes
      where acao = 'status_alterado' and entidade_id = current_setting('teste.p1')
        and perfil_id = '00000000-0000-0000-0000-000000000012') <> 2 then
    raise exception 'FALHOU [log tem status_alterado com o perfil do balconista]';
  end if;
  if not exists (select 1 from log_acoes
      where acao = 'pedido_cancelado' and entidade_id = current_setting('teste.p2')
        and detalhes -> 'antes' ->> 'status' = 'recebido' and detalhes -> 'depois' ->> 'status' = 'cancelado') then
    raise exception 'FALHOU [cancelar grava pedido_cancelado]';
  end if;
  -- Aviso em tempo real para o cliente (só no ambiente local de teste, onde realtime.send é simulado).
  -- Consulta dinâmica (execute): no Supabase real a tabela não existe e o bloco é pulado sem erro.
  if to_regclass('realtime.mensagens_teste') is not null then
    declare v_avisou boolean;
    begin
      execute format(
        'select exists (select 1 from realtime.mensagens_teste where topico = %L and evento = %L and payload ->> %L = %L)',
        'pedido:' || current_setting('teste.p1'), 'status', 'status', 'pronto') into v_avisou;
      if not v_avisou then
        raise exception 'FALHOU [mudança de status avisa o canal do pedido]';
      end if;
    end;
  end if;
end $$;

-------------------------------------------------------------- admin altera o cardápio
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000011"}';
update produtos set preco_m = 16 where id = '00000000-0000-0000-0000-0000000000c1';
update produtos set nome = 'Pastel Log 2' where id = '00000000-0000-0000-0000-0000000000c1';
insert into produtos (id, nome, categoria, preco) values ('00000000-0000-0000-0000-0000000000c2', 'Suco Log', 'Bebidas', 8);
delete from produtos where id = '00000000-0000-0000-0000-0000000000c2';
reset role;

do $$
begin
  if not exists (select 1 from log_acoes
      where acao = 'preco_alterado' and perfil_id = '00000000-0000-0000-0000-000000000011'
        and (detalhes -> 'antes' ->> 'preco_m')::numeric = 15 and (detalhes -> 'depois' ->> 'preco_m')::numeric = 16) then
    raise exception 'FALHOU [admin muda preço grava preco_alterado com antes e depois]';
  end if;
  if not exists (select 1 from log_acoes where acao = 'produto_editado' and detalhes -> 'depois' ->> 'nome' = 'Pastel Log 2') then
    raise exception 'FALHOU [editar nome grava produto_editado]';
  end if;
  if not exists (select 1 from log_acoes where acao = 'produto_criado' and entidade_id = '00000000-0000-0000-0000-0000000000c2') then
    raise exception 'FALHOU [criar produto grava produto_criado]';
  end if;
  if not exists (select 1 from log_acoes where acao = 'produto_excluido' and entidade_id = '00000000-0000-0000-0000-0000000000c2') then
    raise exception 'FALHOU [excluir produto grava produto_excluido]';
  end if;
end $$;

rollback;
select 'OK' as resultado;
