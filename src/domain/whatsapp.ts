import type { Endereco, Pagamento, Tamanho, Tipo } from "./tipos";
import { formatarBRL } from "./pedido";

export function normalizarTelefone(t: string): string | null {
  let d = t.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : null;
}

/** "31975423850" → "(31) 97542-3850". Outros formatos voltam como vieram. */
export function formatarTelefone(t: string): string {
  const m = /^(\d{2})(\d{4,5})(\d{4})$/.exec(t);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
}

/** "Rua das Flores, 120 - apto 3 - Centro" */
export function formatarEndereco(e: Endereco): string {
  return `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""} - ${e.bairro}`;
}

export function linkWhatsApp(numeroComDDI: string, texto: string): string {
  return `https://wa.me/${numeroComDDI}?text=${encodeURIComponent(texto)}`;
}

export interface DadosMensagemLoja {
  numero: number;
  tipo: Tipo;
  cliente: string;
  telefone: string;
  itens: { nome: string; tamanho: Tamanho | null; quantidade: number; precoUnitario: number }[];
  total: number;
  pagamento: Pagamento;
  observacao: string;
  endereco: Endereco | null;
}

export function mensagemPedidoParaLoja(p: DadosMensagemLoja): string {
  const linhas = [
    `*Pedido nº ${p.numero}* · ${p.tipo}`,
    "",
    ...p.itens.map((i) => `${i.quantidade}x ${i.nome}${i.tamanho ? ` (${i.tamanho})` : ""} · ${formatarBRL(i.precoUnitario * i.quantidade)}`),
    "",
    `*Total: ${formatarBRL(p.total)}*`,
    `Pagamento: ${p.pagamento}`,
  ];
  if (p.cliente) linhas.push(`Cliente: ${p.cliente}`);
  linhas.push(`Telefone: ${p.telefone}`);
  if (p.tipo === "Entrega" && p.endereco) {
    linhas.push(`Endereço: ${formatarEndereco(p.endereco)}`);
    if (p.endereco.referencia) linhas.push(`Referência: ${p.endereco.referencia}`);
  }
  if (p.observacao) linhas.push(`Obs.: ${p.observacao}`);
  return linhas.join("\n");
}

export function mensagemStatusParaCliente(tipo: Tipo): string {
  return tipo === "Entrega" ? "Seu pedido saiu para entrega" : "Seu pedido está pronto para retirada";
}
