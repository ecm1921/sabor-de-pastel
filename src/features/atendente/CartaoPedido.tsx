import type { Pedido, Status } from "../../domain/tipos";
import { formatarBRL, proximosStatus } from "../../domain/pedido";
import { formatarEndereco, formatarTelefone, linkWhatsApp, mensagemStatusParaCliente } from "../../domain/whatsapp";
import { StatusBadge } from "../../components/StatusBadge";
import { Botao } from "../../components/base";

/** Texto do botão que leva o pedido ao próximo status. */
function rotuloAcao(destino: Status, p: Pedido): string {
  if (destino === "preparando") return "Aceitar";
  if (destino === "pronto") return p.tipo === "Entrega" ? "Saiu para entrega" : "Pronto";
  return "Entregue";
}

interface Props {
  pedido: Pedido;
  novo: boolean;
  ocupado: boolean;
  aoAvancar: (destino: Status) => void;
  aoCancelar: () => void;
  aoImprimir: () => void;
}

export function CartaoPedido({ pedido: p, novo, ocupado, aoAvancar, aoCancelar, aoImprimir }: Props) {
  const proximos = proximosStatus(p.status);
  const avancar = proximos.filter((s) => s !== "cancelado");
  const titulo = `Pedido nº ${p.numero}`;

  return (
    <article className="pedido" aria-label={titulo} data-status={p.status} data-novo={novo || undefined}>
      <header className="pedido__topo">
        <h3>
          {titulo} <span className="suave pedido__hora">{p.hora}</span>
        </h3>
        <StatusBadge status={p.status} tipo={p.tipo} />
      </header>

      <p className="pedido__meta">
        <strong>{p.tipo}</strong> · {p.pagamento} · <a href={`tel:+55${p.telefone}`}>{formatarTelefone(p.telefone)}</a>
        {p.cliente && <> · {p.cliente}</>}
      </p>
      {p.tipo === "Entrega" && p.endereco && (
        <p className="pedido__endereco">
          {formatarEndereco(p.endereco)}
          {p.endereco.referencia && <span className="suave"> ({p.endereco.referencia})</span>}
        </p>
      )}

      <ul className="pedido__itens">
        {p.itens.map((i, n) => (
          <li key={n}>
            {i.quantidade}x {i.nome}
            {i.tamanho ? ` (${i.tamanho})` : ""}
          </li>
        ))}
      </ul>
      {p.observacao && <p className="pedido__obs">Obs.: {p.observacao}</p>}

      <footer className="pedido__acoes">
        <b className="pedido__total">{formatarBRL(p.total)}</b>
        <div className="pedido__botoes">
          {avancar.map((s) => (
            <Botao key={s} variante={s === "preparando" ? "primario" : "escuro"} carregando={ocupado} onClick={() => aoAvancar(s)}>
              {rotuloAcao(s, p)}
            </Botao>
          ))}
          {p.status === "pronto" && (
            <a
              className="botao botao--whats"
              href={linkWhatsApp(`55${p.telefone}`, mensagemStatusParaCliente(p.tipo))}
              target="_blank"
              rel="noreferrer"
            >
              Avisar no WhatsApp
            </a>
          )}
          <Botao variante="secundario" onClick={aoImprimir}>
            Imprimir
          </Botao>
          {proximos.includes("cancelado") && (
            <Botao variante="perigo" onClick={aoCancelar} disabled={ocupado}>
              Cancelar
            </Botao>
          )}
        </div>
      </footer>
    </article>
  );
}
