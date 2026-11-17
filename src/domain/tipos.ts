export type Tipo = "Retirada" | "Entrega";
export type Pagamento = "Dinheiro" | "Pix" | "Cartão";
export type Categoria = "Pastéis" | "Bebidas" | "Outros";
export type Status = "recebido" | "preparando" | "pronto" | "entregue" | "cancelado";
export type Tamanho = "M" | "G";
export type Papel = "admin" | "balconista";

export const TIPOS: Tipo[] = ["Retirada", "Entrega"];
export const PAGAMENTOS: Pagamento[] = ["Dinheiro", "Pix", "Cartão"];
export const CATEGORIAS: Categoria[] = ["Pastéis", "Bebidas", "Outros"];

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: number | null;
  preco_m: number | null;
  preco_g: number | null;
  ativo: boolean;
}

export interface ItemCarrinho {
  produtoId: string;
  tamanho: Tamanho | null;
  quantidade: number;
}

export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
}

export interface ItemPedido {
  nome: string;
  tamanho: Tamanho | null;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  numero: number;
  dia: string; // AAAA-MM-DD (horário de Brasília)
  hora: string; // HH:MM (horário de Brasília)
  cliente: string;
  telefone: string;
  tipo: Tipo;
  pagamento: Pagamento;
  observacao: string;
  status: Status;
  total: number;
  endereco: Endereco | null;
  itens: ItemPedido[];
}

/** O que o cliente vê do próprio pedido (mesmo formato do pedido da equipe). */
export type PedidoCliente = Pedido;

export type AcaoLog =
  | "pedido_criado"
  | "status_alterado"
  | "pedido_cancelado"
  | "produto_criado"
  | "produto_editado"
  | "produto_excluido"
  | "preco_alterado";

export interface LogAcao {
  id: number;
  quando: string; // ISO
  perfilId: string | null;
  perfilUsuario: string | null;
  perfilNome: string | null;
  acao: AcaoLog;
  entidade: string;
  entidadeId: string;
  detalhes: { antes: Record<string, unknown> | null; depois: Record<string, unknown> | null };
}

export interface Perfil {
  id: string;
  usuario: string;
  nome: string;
  papel: Papel;
}
