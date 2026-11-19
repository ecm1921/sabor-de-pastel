-- Testes do horário de cada etapa do pedido (migração 0007).
-- Rodam dentro de uma transação desfeita no fim. Falha = erro começando com "FALHOU [caso]".
begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000021', 'maria@teste.local');
insert into perfis (id, usuario, nome, papel, ativo) values
  ('00000000-0000-0000-0000-000000000021', 'maria.teste', 'Maria', 'balconista', true);
insert into produtos (id, nome, categoria, preco, preco_m, preco_g) values
  ('00000000-0000-0000-0000-0000000000d1', 'Pastel Horário', 'Pastéis', null, 15, 25);

select set_config('teste.p1', (criar_pedido('Entrega', 'Pix', '', '', '31975423850',
  '{"rua":"Rua A","numero":"1","bairro":"Centro"}',
  '[{"produto_id":"00000000-0000-0000-0000-0000000000d1","tamanho":"M","quantidade":1}]')).id::text, true);
select set_config('teste.p2', (criar_pedido('Retirada', 'Pix', '', '', '31975423850', null,
  '[{"produto_id":"00000000-0000-0000-0000-0000000000d1","tamanho":"M","quantidade":1}]')).id::text, true);

do $$
declare p pedidos;
begin
  select * into p from pedidos where id = current_setting('teste.p1')::uuid;
  if p.preparando_em is not null or p.pronto_em is not null or p.entregue_em is not null then
    raise exception 'FALHOU [pedido novo começa sem horários de etapa]';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000021"}';
select alterar_status(current_setting('teste.p1')::uuid, 'preparando');
select alterar_status(current_setting('teste.p1')::uuid, 'pronto');
select alterar_status(current_setting('teste.p2')::uuid, 'cancelado');
reset role;

do $$
declare p pedidos;
begin
  select * into p from pedidos where id = current_setting('teste.p1')::uuid;
  if p.preparando_em is null or p.pronto_em is null then
    raise exception 'FALHOU [cada etapa grava a hora em que começou]';
  end if;
  if p.entregue_em is not null then
    raise exception 'FALHOU [etapa que não aconteceu fica sem hora]';
  end if;
  select * into p from pedidos where id = current_setting('teste.p2')::uuid;
  if p.cancelado_em is null then
    raise exception 'FALHOU [cancelamento grava a hora]';
  end if;
end $$;

-- o cliente (visitante) recebe os horários junto com o pedido
set local role anon;
set local request.jwt.claims = '{}';
do $$
declare j jsonb;
begin
  j := obter_pedido_cliente(current_setting('teste.p1')::uuid);
  if j->>'preparando_em' is null or j->>'pronto_em' is null or not (j ? 'entregue_em') then
    raise exception 'FALHOU [obter_pedido_cliente devolve os horários]: %', j;
  end if;
end $$;
reset role;

rollback;
select 'OK' as resultado;
