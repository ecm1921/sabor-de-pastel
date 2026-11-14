import type { LogAcao, Status, Tipo } from "./tipos";
import { formatarBRL, rotuloStatus } from "./pedido";

type Linha = Record<string, unknown> | null;

const texto = (r: Linha, campo: string) => String(r?.[campo] ?? "");
const valor = (v: unknown) => formatarBRL(Number(v ?? 0));

function mudancasDePreco(antes: Linha, depois: Linha): string {
  const campos: [string, string][] = [
    ["preco", ""],
    ["preco_m", "M "],
    ["preco_g", "G "],
  ];
  return campos
    .filter(([c]) => antes?.[c] !== depois?.[c] && (antes?.[c] != null || depois?.[c] != null))
    .filter(([c]) => Number(antes?.[c]) !== Number(depois?.[c]))
    .map(([c, rotulo]) => `${rotulo}${valor(antes?.[c])} → ${valor(depois?.[c])}`)
    .join("; ");
}

/** Frase do log em português: quem fez o quê. */
export function descreverAcao(l: LogAcao): string {
  const quem = l.perfilUsuario ?? "Cliente";
  const { antes, depois } = l.detalhes;
  const atual = depois ?? antes;
  const numero = texto(atual, "numero");
  const nome = texto(atual, "nome");

  switch (l.acao) {
    case "pedido_criado":
      return l.perfilUsuario ? `${quem} registrou o pedido nº ${numero}` : `Cliente fez o pedido nº ${numero}`;
    case "status_alterado": {
      const tipo = (texto(depois, "tipo") || "Retirada") as Tipo;
      const de = rotuloStatus(texto(antes, "status") as Status, tipo);
      const para = rotuloStatus(texto(depois, "status") as Status, tipo);
      return `${quem} mudou o pedido nº ${numero} de ${de} para ${para}`;
    }
    case "pedido_cancelado":
      return `${quem} cancelou o pedido nº ${numero}`;
    case "produto_criado":
      return `${quem} criou o item ${nome}`;
    case "produto_excluido":
      return `${quem} excluiu o item ${nome}`;
    case "preco_alterado":
      return `${quem} alterou o preço de ${nome}: ${mudancasDePreco(antes, depois)}`;
    case "produto_editado": {
      if (antes?.ativo !== depois?.ativo) return `${quem} marcou ${nome} como ${depois?.ativo ? "disponível" : "esgotado"}`;
      if (texto(antes, "nome") !== texto(depois, "nome")) return `${quem} renomeou ${texto(antes, "nome")} para ${texto(depois, "nome")}`;
      return `${quem} editou o item ${nome}`;
    }
  }
}
