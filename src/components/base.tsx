import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variante = "primario" | "secundario" | "perigo" | "escuro" | "whats";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  carregando?: boolean;
  largo?: boolean;
}

export function Botao({ variante = "primario", carregando, largo, className = "", disabled, children, ...resto }: BotaoProps) {
  return (
    <button
      type="button"
      {...resto}
      className={`botao botao--${variante}${largo ? " botao--largo" : ""} ${className}`.trim()}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={ativo} onClick={onClick}>
      {children}
    </button>
  );
}

export function Modal({ aberto, aoFechar, titulo, children }: { aberto: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  const id = useId();
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, aoFechar]);
  if (!aberto) return null;
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => e.stopPropagation()}>
        <h2 id={id}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
