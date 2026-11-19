import type { ReactNode } from "react";
import type { Status, Tipo } from "../../domain/tipos";
import { rotuloStatus } from "../../domain/pedido";

const ETAPAS: Status[] = ["recebido", "preparando", "pronto", "entregue"];

/** Ícones de traço (24×24), um por etapa. Decorativos: o nome da etapa vem escrito ao lado. */
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const comanda = (
  <Icone>
    <path d="M5 2h14v20l-2.5-1.5L14 22l-2-1.5L10 22l-2.5-1.5L5 22Z" />
    <path d="M9 7h6M9 11h6M9 15h3" />
  </Icone>
);
const talheres = (
  <Icone>
    <path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18" />
    <path d="M17 21V3c-2.2 1.2-3 3.6-3 7v3h3" />
  </Icone>
);
const sacola = (
  <Icone>
    <path d="M5 8h14l-1 13H6Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Icone>
);
const moto = (
  <Icone>
    <circle cx="5.5" cy="17" r="3" />
    <circle cx="18.5" cy="17" r="3" />
    <path d="M8.5 17h5l3-6h-4l-2 3H7M15 6h2.5l1.5 5" />
  </Icone>
);
const casa = (
  <Icone>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
  </Icone>
);
const confere = (
  <Icone>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Icone>
);

function icone(s: Status, tipo: Tipo) {
  if (s === "recebido") return comanda;
  if (s === "preparando") return talheres;
  if (s === "pronto") return tipo === "Entrega" ? moto : sacola;
  return tipo === "Entrega" ? casa : confere;
}

function destaque(s: Status, tipo: Tipo): { titulo: string; frase: string } {
  if (s === "recebido") return { titulo: "Pedido recebido", frase: "A pastelaria já recebeu seu pedido." };
  if (s === "preparando") return { titulo: "Preparando seu pedido", frase: "Seus pastéis estão sendo feitos agora." };
  if (s === "pronto")
    return tipo === "Entrega"
      ? { titulo: "Saiu para entrega", frase: "Seu pedido está a caminho." }
      : { titulo: "Pronto para retirar", frase: "Pode vir buscar no balcão." };
  return { titulo: "Pedido entregue", frase: "Pedido concluído. Bom apetite!" };
}

/** Andamento do pedido para o cliente: a etapa atual em destaque e a linha de etapas com ícones. */
export function AndamentoPedido({ status, tipo }: { status: Status; tipo: Tipo }) {
  const atual = ETAPAS.indexOf(status);
  const { titulo, frase } = destaque(status, tipo);

  return (
    <section className="andamento" aria-label="Andamento do pedido">
      <div className="andamento__destaque" data-status={status}>
        <span className="andamento__icone-grande">{icone(status, tipo)}</span>
        <div>
          <h2 className="andamento__titulo">{titulo}</h2>
          <p className="andamento__frase">{frase}</p>
        </div>
      </div>
      <ol className="andamento__etapas">
        {ETAPAS.map((s, n) => (
          <li key={s} aria-current={n === atual ? "step" : undefined} data-feito={n < atual || (status === "entregue" && n === atual) || undefined}>
            <span className="andamento__icone">{icone(s, tipo)}</span>
            {rotuloStatus(s, tipo)}
          </li>
        ))}
      </ol>
    </section>
  );
}
