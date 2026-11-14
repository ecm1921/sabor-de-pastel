const FIXAS: Record<string, string> = {
  TRANSICAO_INVALIDA: "Esse pedido já mudou de situação. Atualize a lista.",
  SEM_PERMISSAO: "Você não tem permissão para isso.",
  TELEFONE_INVALIDO: "Confira o telefone com DDD.",
  ENDERECO_INCOMPLETO: "Preencha rua, número e bairro para a entrega.",
  ITENS_VAZIOS: "Escolha pelo menos um item.",
  QUANTIDADE_INVALIDA: "A quantidade de cada item vai de 1 a 50.",
  PEDIDO_NAO_ENCONTRADO: "Pedido não encontrado.",
};

const GENERICA = "Algo deu errado. Tente de novo.";

/** Converte qualquer erro em uma frase para a tela. Nunca mostra detalhes técnicos do banco. */
export function mensagemDeErro(e: unknown): string {
  const msg = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "";
  if (!msg) return GENERICA;
  if (FIXAS[msg]) return FIXAS[msg];
  if (msg.startsWith("ITEM_INDISPONIVEL:")) return `${msg.slice(18)} acabou. Tire do carrinho e tente de novo.`;
  if (msg.startsWith("TAMANHO_INVALIDO:")) return `Escolha o tamanho de ${msg.slice(17)}.`;
  if (msg === "Invalid login credentials") return "Usuário ou senha incorretos.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Sem conexão. Tente de novo.";
  return GENERICA;
}

/** Devolve os dados de uma resposta do Supabase, ou lança o erro dela. */
export function semErro<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data;
}
