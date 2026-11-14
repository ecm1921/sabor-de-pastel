import type { Endereco, Pagamento, Tamanho, Tipo } from "./tipos";
import { formatarBRL } from "./pedido";

export function normalizarTelefone(t: string): string | null {
  let d = t.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : null;
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
    const e = p.endereco;
    linhas.push(`Endereço: ${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""} - ${e.bairro}`);
    if (e.referencia) linhas.push(`Referência: ${e.referencia}`);
  }
  if (p.observacao) linhas.push(`Obs.: ${p.observacao}`);
  return linhas.join("\n");
}

export function mensagemStatusParaCliente(tipo: Tipo): string {
  return tipo === "Entrega" ? "Seu pedido saiu para entrega" : "Seu pedido está pronto para retirada";
}
