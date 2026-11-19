-- Hora em que cada etapa do pedido começou, para o cliente ver no acompanhamento.
-- Seguro de rodar com a loja aberta: só acrescenta colunas vazias e uma regra automática.
alter table pedidos
  add column if not exists preparando_em timestamptz,
  add column if not exists pronto_em     timestamptz,
  add column if not exists entregue_em   timestamptz,
  add column if not exists cancelado_em  timestamptz;

-- Quando o status muda, grava a hora da nova etapa.
create or replace function marcar_horario_status() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    case new.status
      when 'preparando' then new.preparando_em := now();
      when 'pronto'     then new.pronto_em     := now();
      when 'entregue'   then new.entregue_em   := now();
      when 'cancelado'  then new.cancelado_em  := now();
      else null;
    end case;
  end if;
  return new;
end $$;

drop trigger if exists horario_status on pedidos;
create trigger horario_status
  before update of status on pedidos
  for each row execute function marcar_horario_status();

-- A tela do cliente passa a receber os horários (mesma função, com três campos a mais).
create or replace function obter_pedido_cliente(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id,
    'numero', p.numero,
    'tipo', p.tipo,
    'status', p.status,
    'total', p.total,
    'criado_em', p.criado_em,
    'preparando_em', p.preparando_em,
    'pronto_em', p.pronto_em,
    'entregue_em', p.entregue_em,
    'cliente', p.cliente,
    'telefone', p.telefone,
    'pagamento', p.pagamento,
    'observacao', p.observacao,
    'endereco', case when p.tipo = 'Entrega' then jsonb_build_object(
      'rua', p.endereco_rua, 'numero', p.endereco_numero, 'bairro', p.endereco_bairro,
      'complemento', p.endereco_complemento, 'referencia', p.endereco_referencia) else 'null'::jsonb end,
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', i.nome_snapshot, 'tamanho', i.tamanho, 'quantidade', i.quantidade,
        'preco_unitario', i.preco_unitario) order by i.nome_snapshot)
      from itens_pedido i where i.pedido_id = p.id), '[]'::jsonb))
  from pedidos p where p.id = p_id
$$;
