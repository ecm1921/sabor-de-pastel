import type { Endereco, ItemCarrinho, Pagamento, Pedido, PedidoCliente, Status, Tipo } from "../domain/tipos";
import { supabase } from "./supabase";
import { semErro } from "./erros";

const FUSO = "America/Sao_Paulo";

/** Linha de `pedidos` (com itens_pedido) ou JSON de `obter_pedido_cliente` → Pedido. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function paraPedido(r: any): Pedido {
  const criado = new Date(r.criado_em);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens = (r.itens_pedido ?? r.itens ?? []).map((i: any) => ({
    nome: i.nome_snapshot ?? i.nome,
    tamanho: i.tamanho ?? null,
    quantidade: Number(i.quantidade),
    precoUnitario: Number(i.preco_unitario),
  }));
  let endereco: Endereco | null = null;
  if (r.tipo === "Entrega") {
    const e = r.endereco ?? {
      rua: r.endereco_rua,
      numero: r.endereco_numero,
      bairro: r.endereco_bairro,
      complemento: r.endereco_complemento,
      referencia: r.endereco_referencia,
    };
    endereco = {
      rua: e.rua ?? "",
      numero: e.numero ?? "",
      bairro: e.bairro ?? "",
      complemento: e.complemento ?? "",
      referencia: e.referencia ?? "",
    };
  }
  return {
    id: r.id,
    numero: Number(r.numero),
    dia: r.dia ?? criado.toLocaleDateString("en-CA", { timeZone: FUSO }),
    hora: criado.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO }),
    cliente: r.cliente ?? "",
    telefone: r.telefone,
    tipo: r.tipo,
    pagamento: r.pagamento,
    observacao: r.observacao ?? "",
    status: r.status,
    total: Number(r.total),
    endereco,
    itens,
  };
}

export interface NovoPedido {
  tipo: Tipo;
  pagamento: Pagamento;
  cliente: string;
  observacao: string;
  telefone: string;
  endereco: Endereco | null;
  itens: ItemCarrinho[];
  /** Código gerado no aparelho: reenviar com o mesmo código não duplica o pedido. */
  id?: string;
}

export async function criarPedido(input: NovoPedido): Promise<{ id: string; numero: number }> {
  const data = semErro(
    await supabase.rpc("criar_pedido", {
      p_tipo: input.tipo,
      p_pagamento: input.pagamento,
      p_cliente: input.cliente,
      p_observacao: input.observacao,
      p_telefone: input.telefone,
      p_endereco: input.endereco,
      p_itens: input.itens.map((i) => ({ produto_id: i.produtoId, tamanho: i.tamanho, quantidade: i.quantidade })),
      p_id: input.id ?? null,
    }),
  ) as { id: string; numero: number }[];
  return { id: data[0].id, numero: data[0].numero };
}

export async function obterPedidoCliente(id: string): Promise<PedidoCliente | null> {
  const data = semErro(await supabase.rpc("obter_pedido_cliente", { p_id: id }));
  return data ? paraPedido(data) : null;
}

export async function listarPedidosDoDia(dia: string): Promise<Pedido[]> {
  const data = semErro(
    await supabase.from("pedidos").select("*, itens_pedido(*)").eq("dia", dia).order("numero", { ascending: false }),
  );
  return (data ?? []).map(paraPedido);
}

export async function alterarStatus(id: string, novo: Status): Promise<void> {
  semErro(await supabase.rpc("alterar_status", { p_pedido: id, p_novo: novo }));
}

/** Avisa quando algum pedido do dia é criado ou muda (tela do atendente). Devolve a função para parar. */
export function assinarPedidosDoDia(dia: string, aoMudar: () => void): () => void {
  const canal = supabase
    .channel(`pedidos-${dia}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos", filter: `dia=eq.${dia}` }, () => aoMudar())
    // Ao conectar (ou reconectar depois de uma queda), recarrega: eventos perdidos na queda não são reenviados.
    .subscribe((status) => {
      if (status === "SUBSCRIBED") aoMudar();
    });
  return () => {
    supabase.removeChannel(canal);
  };
}

/** Avisa o cliente quando o status do pedido muda. Consulta a cada 15 s como reserva. */
export function assinarStatusDoPedido(id: string, aoMudar: (s: Status) => void): () => void {
  const canal = supabase
    .channel(`pedido:${id}`)
    .on("broadcast", { event: "status" }, ({ payload }) => aoMudar(payload.status as Status))
    .subscribe();
  const reserva = setInterval(async () => {
    try {
      const p = await obterPedidoCliente(id);
      if (p) aoMudar(p.status);
    } catch {
      // sem conexão: tenta de novo na próxima
    }
  }, 15000);
  return () => {
    clearInterval(reserva);
    supabase.removeChannel(canal);
  };
}
