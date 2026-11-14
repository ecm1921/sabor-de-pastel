-- Testes de criar_pedido. Rodam dentro de uma transação desfeita no fim (nada fica gravado).
-- Se algum caso falhar, aparece um erro começando com "FALHOU [nome do caso]".
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

delete from contador_dia;
insert into produtos (id, nome, categoria, preco, preco_m, preco_g, ativo) values
  ('00000000-0000-0000-0000-0000000000a1', 'Pastel Teste',   'Pastéis', null, 15, 25, true),
  ('00000000-0000-0000-0000-0000000000a2', 'Bebida Teste',   'Bebidas', 10, null, null, true),
  ('00000000-0000-0000-0000-0000000000a3', 'Pastel Inativo', 'Pastéis', null, 15, 25, false);

do $$
declare r record; p pedidos;
begin
  -- cria pedido com numero 1 no dia e status recebido
  select * into r from criar_pedido('Retirada', 'Pix', 'Ana', '', '31975423850', null,
    '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]');
  select * into p from pedidos where id = r.id;
  if r.numero <> 1 or p.status <> 'recebido' then
    raise exception 'FALHOU [numero 1 e status recebido]: numero %, status %', r.numero, p.status;
  end if;

  -- segundo pedido no mesmo dia recebe numero 2
  select * into r from criar_pedido('Retirada', 'Pix', '', '', '31975423850', null,
    '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]');
  if r.numero <> 2 then raise exception 'FALHOU [segundo pedido numero 2]: veio %', r.numero; end if;

  -- total usa preço do banco, não o enviado (2 x Pastel M 15 + 1 Bebida 10 = 40)
  select * into r from criar_pedido('Retirada', 'Dinheiro', '', '', '31975423850', null,
    '[{"produto_id":"00000000-0000-0000-0000-0000000000a1","tamanho":"M","quantidade":2,"preco_unitario":1},
      {"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]');
  select * into p from pedidos where id = r.id;
  if p.total <> 40.00 then raise exception 'FALHOU [total usa preço do banco]: veio %', p.total; end if;
  if (select count(*) from itens_pedido where pedido_id = r.id) <> 2 then
    raise exception 'FALHOU [itens gravados]';
  end if;

  -- retirada ignora endereço
  select * into r from criar_pedido('Retirada', 'Pix', '', '', '31975423850',
    '{"rua":"Rua A","numero":"1","bairro":"Centro","complemento":"","referencia":""}',
    '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]');
  select * into p from pedidos where id = r.id;
  if p.endereco_rua is not null or p.endereco_bairro is not null then
    raise exception 'FALHOU [retirada ignora endereço]: rua %', p.endereco_rua;
  end if;

  -- entrega grava o endereço
  select * into r from criar_pedido('Entrega', 'Pix', '', '', '31975423850',
    '{"rua":"Rua A","numero":"10","bairro":"Centro","complemento":"apto 2","referencia":"perto da praça"}',
    '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]');
  select * into p from pedidos where id = r.id;
  if p.endereco_rua <> 'Rua A' or p.endereco_numero <> '10' or p.endereco_bairro <> 'Centro' then
    raise exception 'FALHOU [entrega grava endereço]';
  end if;
end $$;

select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','31975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a3","tamanho":"M","quantidade":1}]') $q$,
  'ITEM_INDISPONIVEL:', 'item inativo é recusado');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','31975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a1","tamanho":null,"quantidade":1}]') $q$,
  'TAMANHO_INVALIDO:', 'pastel sem tamanho é recusado');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','31975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":"G","quantidade":1}]') $q$,
  'TAMANHO_INVALIDO:', 'bebida com tamanho é recusada');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','31975423850',null,'[]') $q$,
  'ITENS_VAZIOS', 'lista vazia é recusada');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','31975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":51}]') $q$,
  'QUANTIDADE_INVALIDA', 'quantidade acima de 50 é recusada');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Retirada','Pix','','','975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]') $q$,
  'TELEFONE_INVALIDO', 'telefone com 9 dígitos é recusado');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Entrega','Pix','','','31975423850',
      '{"rua":"Rua A","numero":"10","bairro":"","complemento":"","referencia":""}',
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]') $q$,
  'ENDERECO_INCOMPLETO', 'entrega sem bairro é recusada');
select pg_temp.espera_erro(
  $q$ select criar_pedido('Entrega','Pix','','','31975423850',null,
      '[{"produto_id":"00000000-0000-0000-0000-0000000000a2","tamanho":null,"quantidade":1}]') $q$,
  'ENDERECO_INCOMPLETO', 'entrega sem endereço é recusada');

rollback;
select 'OK' as resultado;
