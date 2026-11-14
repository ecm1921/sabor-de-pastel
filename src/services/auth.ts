import type { Perfil } from "../domain/tipos";
import { supabase } from "./supabase";
import { semErro } from "./erros";

const SENHA_INCORRETA = { message: "Invalid login credentials" };

async function emailDoUsuario(usuario: string): Promise<string | null> {
  return semErro(await supabase.rpc("email_do_usuario", { p_usuario: usuario.trim().toLowerCase() })) as string | null;
}

/** Endereço do site para onde o link de "esqueci minha senha" volta. */
export const urlRecuperacao = () => `${window.location.origin}${import.meta.env.BASE_URL}?recuperar=1`;

export async function perfilAtual(): Promise<Perfil | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await supabase
    .from("perfis")
    .select("id, usuario, nome, papel, ativo")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!p || !p.ativo) return null;
  return { id: p.id, usuario: p.usuario, nome: p.nome, papel: p.papel };
}

/** Login por usuário e senha. Usuário inexistente dá o mesmo erro de senha errada (não revela quem existe). */
export async function entrar(usuario: string, senha: string): Promise<Perfil> {
  const email = await emailDoUsuario(usuario);
  if (!email) throw SENHA_INCORRETA;
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  const perfil = await perfilAtual();
  if (!perfil) {
    await supabase.auth.signOut();
    throw SENHA_INCORRETA;
  }
  return perfil;
}

export async function sair(): Promise<void> {
  await supabase.auth.signOut();
}

/** Envia o link de nova senha para o e-mail do usuário. Não avisa se o usuário não existe. */
export async function recuperarSenha(usuario: string): Promise<void> {
  const email = await emailDoUsuario(usuario);
  if (!email) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: urlRecuperacao() });
  if (error) throw error;
}

export async function definirNovaSenha(senha: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw error;
}
