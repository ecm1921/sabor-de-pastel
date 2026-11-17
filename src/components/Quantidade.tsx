interface Props {
  valor: number;
  aoMudar: (novo: number) => void;
  rotulo: string;
  min?: number;
  max?: number;
}

export function Quantidade({ valor, aoMudar, rotulo, min = 0, max = 50 }: Props) {
  return (
    <div className="qtd">
      <button type="button" aria-label={`Diminuir ${rotulo}`} disabled={valor <= min} onClick={() => valor > min && aoMudar(valor - 1)}>
        −
      </button>
      <output aria-live="polite" aria-label={`Quantidade de ${rotulo}`}>
        {valor}
      </output>
      <button type="button" aria-label={`Aumentar ${rotulo}`} disabled={valor >= max} onClick={() => valor < max && aoMudar(valor + 1)}>
        +
      </button>
    </div>
  );
}
