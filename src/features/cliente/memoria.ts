import { dadosVazios, type DadosPedido } from "../pedido/dados";

// Guardado só no aparelho do cliente. Pode falhar (aba anônima, armazenamento bloqueado): o app segue sem.
const PEDIDOS = "sabor.meusPedidos";
const DADOS = "sabor.meusDados";

function ler<T>(chave: string): T | null {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // sem armazenamento: ignora
  }
}

export function meusPedidos(): string[] {
  const v = ler<unknown>(PEDIDOS);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function guardarPedido(id: string) {
  gravar(PEDIDOS, [id, ...meusPedidos().filter((x) => x !== id)].slice(0, 20));
}

/** Telefone, nome, tipo e endereço do último pedido (pagamento e observação não). */
export function meusDados(): DadosPedido {
  const base = dadosVazios();
  const v = ler<Partial<DadosPedido>>(DADOS);
  if (!v || typeof v !== "object") return base;
  return {
    ...base,
    cliente: typeof v.cliente === "string" ? v.cliente : "",
    telefone: typeof v.telefone === "string" ? v.telefone : "",
    tipo: v.tipo === "Entrega" ? "Entrega" : "Retirada",
    endereco: { ...base.endereco, ...(v.endereco ?? {}) },
  };
}

export function guardarDados(d: DadosPedido) {
  gravar(DADOS, { cliente: d.cliente, telefone: d.telefone, tipo: d.tipo, endereco: d.endereco });
}
