import { useId, useState } from "react";

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  autoComplete: "current-password" | "new-password";
}

/** Campo de senha com botão para mostrar ou esconder o que foi digitado. */
export function CampoSenha({ rotulo, valor, aoMudar, autoComplete }: Props) {
  const id = useId();
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="campo">
      <label htmlFor={id} className="campo__rotulo">
        {rotulo}
      </label>
      <div className="campo__senha">
        <input id={id} type={visivel ? "text" : "password"} value={valor} onChange={(e) => aoMudar(e.target.value)} autoComplete={autoComplete} />
        <button type="button" aria-label={visivel ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visivel} onClick={() => setVisivel(!visivel)}>
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}
