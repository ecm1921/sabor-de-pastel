import type { ItemCarrinho, Tamanho } from "../../domain/tipos";

export type Carrinho = Record<string, ItemCarrinho>;

export type AcaoCarrinho =
  | { tipo: "mais" | "menos"; produtoId: string; tamanho: Tamanho | null }
  | { tipo: "limpar" };

export const chaveItem = (produtoId: string, tamanho: Tamanho | null) => `${produtoId}|${tamanho ?? ""}`;

const MAXIMO = 50;

export function carrinhoReducer(estado: Carrinho, acao: AcaoCarrinho): Carrinho {
  if (acao.tipo === "limpar") return {};
  const chave = chaveItem(acao.produtoId, acao.tamanho);
  const atual = estado[chave]?.quantidade ?? 0;
  const nova = acao.tipo === "mais" ? Math.min(atual + 1, MAXIMO) : atual - 1;
  const { [chave]: _removido, ...resto } = estado;
  if (nova <= 0) return resto;
  return { ...estado, [chave]: { produtoId: acao.produtoId, tamanho: acao.tamanho, quantidade: nova } };
}

export const itensDoCarrinho = (estado: Carrinho): ItemCarrinho[] => Object.values(estado);
