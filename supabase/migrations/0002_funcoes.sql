-- Funções chamadas pelo app. "security definer" = roda com permissão do dono da função,
-- então o visitante consegue criar pedido sem ter acesso direto às tabelas.

-- Cria um pedido completo (pedido + itens) de uma vez. Preços e total vêm do banco, nunca do aparelho.
create function criar_pedido(
  p_tipo text,
  p_pagamento text,
  p_cliente text,
  p_observacao text,
  p_telefone text,
  p_endereco jsonb,
  p_itens jsonb
) returns table (id uuid, numero int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_item     jsonb;
  v_produto  produtos;
  v_tamanho  text;
  v_qtd      int;
  v_preco    numeric(10, 2);
  v_total    numeric(10, 2) := 0;
  v_itens    jsonb := '[]';
  v_dia      date := (now() at time zone 'America/Sao_Paulo')::date;
  v_numero   int;
  v_id       uuid;
  v_entrega  boolean := p_tipo = 'Entrega';
begin
  if coalesce(p_telefone, '') !~ '^[0-9]{10,11}$' then
    raise exception 'TELEFONE_INVALIDO';
  end if;

  if v_entrega and (
       coalesce(trim(p_endereco ->> 'rua'), '') = ''
    or coalesce(trim(p_endereco ->> 'numero'), '') = ''
    or coalesce(trim(p_endereco ->> 'bairro'), '') = '') then
    raise exception 'ENDERECO_INCOMPLETO';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_VAZIOS';
  end if;

  -- Valida cada item e calcula o preço com os valores atuais do cardápio.
  for v_item in select * from jsonb_array_elements(p_itens) loop
    select * into v_produto from produtos where produtos.id = (v_item ->> 'produto_id')::uuid;
    if not found or not v_produto.ativo then
      raise exception 'ITEM_INDISPONIVEL:%', coalesce(v_produto.nome, 'item');
    end if;

    v_qtd := (v_item ->> 'quantidade')::int;
    if v_qtd is null or v_qtd < 1 or v_qtd > 50 then
      raise exception 'QUANTIDADE_INVALIDA';
    end if;

    v_tamanho := nullif(v_item ->> 'tamanho', '');
    if v_produto.categoria = 'Pastéis' then
      if v_tamanho is null or v_tamanho not in ('M', 'G') then
        raise exception 'TAMANHO_INVALIDO:%', v_produto.nome;
      end if;
      v_preco := case v_tamanho when 'M' then v_produto.preco_m else v_produto.preco_g end;
    else
      if v_tamanho is not null then
        raise exception 'TAMANHO_INVALIDO:%', v_produto.nome;
      end if;
      v_preco := v_produto.preco;
    end if;

    v_total := v_total + v_preco * v_qtd;
    v_itens := v_itens || jsonb_build_object(
      'produto_id', v_produto.id, 'nome', v_produto.nome,
      'tamanho', v_tamanho, 'quantidade', v_qtd, 'preco', v_preco);
  end loop;

  -- Próximo número do dia, sem repetir mesmo com dois pedidos ao mesmo tempo.
  insert into contador_dia (dia, ultimo) values (v_dia, 1)
  on conflict (dia) do update set ultimo = contador_dia.ultimo + 1
  returning ultimo into v_numero;

  insert into pedidos (
    numero, dia, cliente, tipo, pagamento, observacao, telefone,
    endereco_rua, endereco_numero, endereco_bairro, endereco_complemento, endereco_referencia,
    total, atualizado_por)
  values (
    v_numero, v_dia, coalesce(trim(p_cliente), ''), p_tipo, p_pagamento, coalesce(trim(p_observacao), ''), p_telefone,
    case when v_entrega then trim(p_endereco ->> 'rua') end,
    case when v_entrega then trim(p_endereco ->> 'numero') end,
    case when v_entrega then trim(p_endereco ->> 'bairro') end,
    case when v_entrega then coalesce(trim(p_endereco ->> 'complemento'), '') end,
    case when v_entrega then coalesce(trim(p_endereco ->> 'referencia'), '') end,
    v_total, auth.uid())
  returning pedidos.id into v_id;

  insert into itens_pedido (pedido_id, produto_id, nome_snapshot, tamanho, quantidade, preco_unitario)
  select v_id, (i ->> 'produto_id')::uuid, i ->> 'nome', i ->> 'tamanho', (i ->> 'quantidade')::int, (i ->> 'preco')::numeric
  from jsonb_array_elements(v_itens) as i;

  id := v_id;
  numero := v_numero;
  return next;
end $$;

revoke execute on function criar_pedido(text, text, text, text, text, jsonb, jsonb) from public;
grant execute on function criar_pedido(text, text, text, text, text, jsonb, jsonb) to anon, authenticated;
