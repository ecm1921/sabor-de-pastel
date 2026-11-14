-- Simulação mínima do ambiente do Supabase, SÓ para rodar os testes localmente (PGlite).
-- No Supabase de verdade isso já existe; este arquivo nunca é aplicado lá.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text unique);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create schema realtime;
create table realtime.mensagens_teste (topico text, evento text, payload jsonb);
create function realtime.send(payload jsonb, event text, topic text, private boolean default true)
returns void language sql as $$ insert into realtime.mensagens_teste values (topic, event, payload) $$;
-- Permissões padrão do Supabase: anon e authenticated recebem acesso a tudo em public; quem restringe é a RLS.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
