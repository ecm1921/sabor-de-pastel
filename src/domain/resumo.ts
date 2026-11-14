import { PAGAMENTOS, type ItemPedido, type Pagamento, type Pedido } from "./tipos";
import { calcularTotal, rotuloStatus } from "./pedido";
import { formatarData } from "./datas";

export interface ResumoDia {
  total: number;
  quantidade: number;
  ticketMedio: number;
  pasteis: number;
  cancelados: number;
  porPagamento: Record<Pagamento, { quantidade: number; valor: number }>;
  maisVendidos: { nome: string; quantidade: number }[];
}

const nomeItem = (i: ItemPedido) => `${i.nome}${i.tamanho ? ` (${i.tamanho})` : ""}`;

/** Indicadores do dia. Pedidos cancelados não entram nas somas, só na contagem de cancelados. */
export function resumirDia(pedidos: Pedido[]): ResumoDia {
  const validos = pedidos.filter((p) => p.status !== "cancelado");
  const total = calcularTotal(validos.map((p) => ({ precoUnitario: p.total, quantidade: 1 })));

  const porPagamento = Object.fromEntries(PAGAMENTOS.map((f) => [f, { quantidade: 0, valor: 0 }])) as ResumoDia["porPagamento"];
  for (const p of validos) {
    porPagamento[p.pagamento].quantidade += 1;
    porPagamento[p.pagamento].valor = calcularTotal([
      { precoUnitario: porPagamento[p.pagamento].valor, quantidade: 1 },
      { precoUnitario: p.total, quantidade: 1 },
    ]);
  }

  const contagem = new Map<string, number>();
  let pasteis = 0;
  for (const i of validos.flatMap((p) => p.itens)) {
    contagem.set(nomeItem(i), (contagem.get(nomeItem(i)) ?? 0) + i.quantidade);
    if (i.tamanho) pasteis += i.quantidade; // só pastéis têm tamanho
  }
  const maisVendidos = [...contagem]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    total,
    quantidade: validos.length,
    ticketMedio: validos.length ? Math.round((total / validos.length) * 100) / 100 : 0,
    pasteis,
    cancelados: pedidos.length - validos.length,
    porPagamento,
    maisVendidos,
  };
}

/** Campo de CSV: entre aspas se tiver ; aspas ou quebra de linha. */
const campo = (v: string | number) => {
  const s = String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV com separador ";" e vírgula decimal (abre direto no Excel em português). */
export function gerarCsv(pedidos: Pedido[]): string {
  const linhas = [["pedido", "data", "hora", "cliente", "tipo", "pagamento", "status", "itens", "total"].join(";")];
  for (const p of pedidos) {
    linhas.push(
      [
        p.numero,
        formatarData(p.dia),
        p.hora,
        p.cliente,
        p.tipo,
        p.pagamento,
        rotuloStatus(p.status, p.tipo),
        p.itens.map((i) => `${i.quantidade}x ${nomeItem(i)}`).join(" + "),
        p.total.toFixed(2).replace(".", ","),
      ]
        .map(campo)
        .join(";"),
    );
  }
  return linhas.join("\r\n");
}
