-- Log de ações: gravado pelo próprio banco a cada mudança, então não dá para "pular" pelo app.

-- Quem está agindo (só se tiver perfil; visitante fica nulo).
create function perfil_do_usuario() returns uuid
language sql stable security definer set search_path = public as $$
  select id from perfis where id = auth.uid()
$$;

create function registrar_log_produto() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_acao text;
  v_id   uuid;
begin
  if tg_op = 'INSERT' then
    v_acao := 'produto_criado';  v_id := new.id;
  elsif tg_op = 'DELETE' then
    v_acao := 'produto_excluido'; v_id := old.id;
  elsif new.preco is distinct from old.preco
     or new.preco_m is distinct from old.preco_m
     or new.preco_g is distinct from old.preco_g then
    v_acao := 'preco_alterado';  v_id := new.id;
  else
    v_acao := 'produto_editado'; v_id := new.id;
  end if;

  insert into log_acoes (perfil_id, acao, entidade, entidade_id, detalhes)
  values (perfil_do_usuario(), v_acao, 'produtos', v_id::text,
          jsonb_build_object(
            'antes',  case when tg_op = 'INSERT' then null else to_jsonb(old) end,
            'depois', case when tg_op = 'DELETE' then null else to_jsonb(new) end));
  return null;
end $$;

create trigger log_produtos
  after insert or update or delete on produtos
  for each row execute function registrar_log_produto();

create function registrar_log_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into log_acoes (perfil_id, acao, entidade, entidade_id, detalhes)
    values (perfil_do_usuario(), 'pedido_criado', 'pedidos', new.id::text,
            jsonb_build_object('antes', null, 'depois', to_jsonb(new)));
  elsif new.status is distinct from old.status then
    insert into log_acoes (perfil_id, acao, entidade, entidade_id, detalhes)
    values (perfil_do_usuario(),
            case when new.status = 'cancelado' then 'pedido_cancelado' else 'status_alterado' end,
            'pedidos', new.id::text,
            jsonb_build_object('antes', to_jsonb(old), 'depois', to_jsonb(new)));
    -- Avisa a tela do cliente (canal público cujo nome tem o id aleatório do pedido).
    perform realtime.send(jsonb_build_object('status', new.status), 'status', 'pedido:' || new.id, false);
  end if;
  return null;
end $$;

create trigger log_pedidos
  after insert or update of status on pedidos
  for each row execute function registrar_log_pedido();

-- A tela do atendente escuta inserções e mudanças em pedidos (Supabase Realtime).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table pedidos;
  end if;
end $$;
