import type { Endereco, ItemCarrinho, Pagamento, Tipo } from "../../domain/tipos";
import { normalizarTelefone } from "../../domain/whatsapp";
import type { NovoPedido } from "../../services/pedidos";

/** Dados do pedido além dos itens (os mesmos na tela do cliente e no balcão). */
export interface DadosPedido {
  cliente: string;
  telefone: string;
  tipo: Tipo;
  pagamento: Pagamento;
  observacao: string;
  endereco: Endereco;
}

export type ErrosDados = Partial<Record<"cliente" | "telefone" | "rua" | "numero" | "bairro", string>>;

export const dadosVazios = (): DadosPedido => ({
  cliente: "",
  telefone: "",
  tipo: "Retirada",
  pagamento: "Pix",
  observacao: "",
  endereco: { rua: "", numero: "", bairro: "", complemento: "", referencia: "" },
});

export function validarDados(d: DadosPedido): ErrosDados {
  const erros: ErrosDados = {};
  if (!d.cliente.trim()) erros.cliente = "Informe o nome.";
  if (!normalizarTelefone(d.telefone)) erros.telefone = "Informe o telefone com DDD.";
  if (d.tipo === "Entrega") {
    if (!d.endereco.rua.trim()) erros.rua = "Informe a rua.";
    if (!d.endereco.numero.trim()) erros.numero = "Informe o número.";
    if (!d.endereco.bairro.trim()) erros.bairro = "Informe o bairro.";
  }
  return erros;
}

export function paraEnvio(d: DadosPedido, itens: ItemCarrinho[]): NovoPedido {
  const e = d.endereco;
  return {
    tipo: d.tipo,
    pagamento: d.pagamento,
    cliente: d.cliente.trim(),
    observacao: d.observacao.trim(),
    telefone: normalizarTelefone(d.telefone) ?? "",
    endereco:
      d.tipo === "Entrega"
        ? { rua: e.rua.trim(), numero: e.numero.trim(), bairro: e.bairro.trim(), complemento: e.complemento.trim(), referencia: e.referencia.trim() }
        : null,
    itens,
  };
}
