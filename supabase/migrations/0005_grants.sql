-- Permissões nas tabelas, explícitas (não dependem do padrão de cada projeto Supabase).
-- A RLS (0003) continua decidindo QUAIS linhas cada um vê; aqui decidimos QUAIS operações existem.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Cardápio: todos leem (a RLS mostra só os ativos para o visitante); a equipe altera (a RLS libera só o admin).
grant select on produtos to anon, authenticated;
grant insert, update, delete on produtos to authenticated;

-- Pedidos, itens, log e perfis: só a equipe lê. Ninguém grava direto: só pelas funções do banco.
grant select on pedidos, itens_pedido, log_acoes, perfis to authenticated;

-- contador_dia: nenhum acesso pelo app.

-- Funções internas (triggers e auxiliares) não ficam disponíveis pela API.
revoke execute on function perfil_do_usuario() from public, anon, authenticated;
revoke execute on function registrar_log_produto() from public, anon, authenticated;
revoke execute on function registrar_log_pedido() from public, anon, authenticated;
