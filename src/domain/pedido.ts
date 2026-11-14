import type { Produto, Status, Tamanho, Tipo } from "./tipos";

export const temTamanho = (p: Pick<Produto, "categoria">) => p.categoria === "Pastéis";

export function precoUnitario(p: Produto, t: Tamanho | null): number {
  if (temTamanho(p)) {
    if (!t) throw new Error(`${p.nome} precisa de tamanho`);
    return (t === "M" ? p.preco_m : p.preco_g) ?? 0;
  }
  if (t) throw new Error(`${p.nome} não tem tamanho`);
  return p.preco ?? 0;
}

export function calcularTotal(itens: { precoUnitario: number; quantidade: number }[]): number {
  const centavos = itens.reduce((soma, i) => soma + Math.round(i.precoUnitario * 100) * i.quantidade, 0);
  return centavos / 100;
}

const TRANSICOES: Record<Status, Status[]> = {
  recebido: ["preparando", "cancelado"],
  preparando: ["pronto", "cancelado"],
  pronto: ["entregue"],
  entregue: [],
  cancelado: [],
};

export function proximosStatus(s: Status): Status[] {
  return TRANSICOES[s];
}

const ROTULOS: Record<Status, string> = {
  recebido: "Recebido",
  preparando: "Preparando",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function rotuloStatus(s: Status, tipo: Tipo): string {
  if (s === "pronto" && tipo === "Entrega") return "Saiu para entrega";
  return ROTULOS[s];
}

export function formatarBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
