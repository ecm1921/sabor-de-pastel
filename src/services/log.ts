import type { LogAcao } from "../domain/tipos";
import { supabase } from "./supabase";
import { semErro } from "./erros";

/** Dia seguinte (AAAA-MM-DD). */
const proximoDia = (dia: string) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export async function listarLog(f: { dia?: string; perfilId?: string }): Promise<LogAcao[]> {
  let q = supabase.from("log_acoes").select("*, perfis(usuario, nome)").order("quando", { ascending: false }).limit(500);
  if (f.dia) q = q.gte("quando", `${f.dia}T00:00:00-03:00`).lt("quando", `${proximoDia(f.dia)}T00:00:00-03:00`);
  if (f.perfilId) q = q.eq("perfil_id", f.perfilId);
  const data = semErro(await q) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    quando: r.quando,
    perfilId: r.perfil_id,
    perfilUsuario: r.perfis?.usuario ?? null,
    perfilNome: r.perfis?.nome ?? null,
    acao: r.acao,
    entidade: r.entidade,
    entidadeId: r.entidade_id,
    detalhes: { antes: r.detalhes?.antes ?? null, depois: r.detalhes?.depois ?? null },
  }));
}

export async function listarPerfis(): Promise<{ id: string; usuario: string; nome: string }[]> {
  return semErro(await supabase.from("perfis").select("id, usuario, nome").order("nome")) ?? [];
}
