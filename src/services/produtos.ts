import type { Produto } from "../domain/tipos";
import { supabase } from "./supabase";
import { semErro } from "./erros";

const COLUNAS = "id, nome, categoria, preco, preco_m, preco_g, ativo";

const numeroOuNulo = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const paraProduto = (r: any): Produto => ({
  id: r.id,
  nome: r.nome,
  categoria: r.categoria,
  preco: numeroOuNulo(r.preco),
  preco_m: numeroOuNulo(r.preco_m),
  preco_g: numeroOuNulo(r.preco_g),
  ativo: r.ativo,
});

export async function listarCardapio(): Promise<Produto[]> {
  const data = semErro(await supabase.from("produtos").select(COLUNAS).eq("ativo", true).order("nome"));
  return (data ?? []).map(paraProduto);
}

export async function listarProdutos(): Promise<Produto[]> {
  const data = semErro(await supabase.from("produtos").select(COLUNAS).order("nome"));
  return (data ?? []).map(paraProduto);
}

export async function salvarProduto(p: Omit<Produto, "id"> & { id?: string }): Promise<Produto> {
  const pastel = p.categoria === "Pastéis";
  const linha = {
    nome: p.nome,
    categoria: p.categoria,
    ativo: p.ativo,
    preco: pastel ? null : p.preco,
    preco_m: pastel ? p.preco_m : null,
    preco_g: pastel ? p.preco_g : null,
  };
  const consulta = p.id
    ? supabase.from("produtos").update(linha).eq("id", p.id).select(COLUNAS).single()
    : supabase.from("produtos").insert(linha).select(COLUNAS).single();
  return paraProduto(semErro(await consulta));
}

export async function definirAtivo(id: string, ativo: boolean): Promise<void> {
  semErro(await supabase.from("produtos").update({ ativo }).eq("id", id));
}

/** Exclui; se o item já tem vendas (o banco recusa), apenas desativa para não quebrar o histórico. */
export async function excluirProduto(id: string): Promise<"excluido" | "desativado"> {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (!error) return "excluido";
  if ((error as { code?: string }).code === "23503") {
    await definirAtivo(id, false);
    return "desativado";
  }
  throw error;
}
