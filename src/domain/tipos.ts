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
