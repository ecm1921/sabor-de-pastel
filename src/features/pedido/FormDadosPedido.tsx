import type { ReactNode } from "react";
import { PAGAMENTOS, TIPOS, type Endereco } from "../../domain/tipos";
import { Chip } from "../../components/base";
import type { DadosPedido, ErrosDados } from "./dados";

interface Props {
  dados: DadosPedido;
  aoMudar: (d: DadosPedido) => void;
  erros: ErrosDados;
}

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      {children}
      {erro && <span className="campo__erro">{erro}</span>}
    </label>
  );
}

/** Telefone, retirada/entrega, endereço, pagamento e observação. */
export function FormDadosPedido({ dados, aoMudar, erros }: Props) {
  const muda = (parcial: Partial<DadosPedido>) => aoMudar({ ...dados, ...parcial });
  const mudaEnd = (parcial: Partial<Endereco>) => muda({ endereco: { ...dados.endereco, ...parcial } });

  return (
    <div className="form-dados">
      <fieldset className="grupo">
        <legend>Como vai receber</legend>
        <div className="chips">
          {TIPOS.map((t) => (
            <Chip key={t} ativo={dados.tipo === t} onClick={() => muda({ tipo: t })}>
              {t}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="linha-campos">
        <Campo rotulo="Nome (opcional)">
          <input value={dados.cliente} onChange={(e) => muda({ cliente: e.target.value })} autoComplete="name" maxLength={80} />
        </Campo>
        <Campo rotulo="Telefone com DDD" erro={erros.telefone}>
          <input
            value={dados.telefone}
            onChange={(e) => muda({ telefone: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(31) 99999-9999"
            aria-invalid={!!erros.telefone}
          />
        </Campo>
      </div>

      {dados.tipo === "Entrega" && (
        <fieldset className="grupo">
          <legend>Endereço de entrega</legend>
          <Campo rotulo="Rua" erro={erros.rua}>
            <input value={dados.endereco.rua} onChange={(e) => mudaEnd({ rua: e.target.value })} maxLength={120} autoComplete="address-line1" aria-invalid={!!erros.rua} />
          </Campo>
          <div className="linha-campos">
            <Campo rotulo="Número" erro={erros.numero}>
              <input value={dados.endereco.numero} onChange={(e) => mudaEnd({ numero: e.target.value })} maxLength={20} inputMode="numeric" aria-invalid={!!erros.numero} />
            </Campo>
            <Campo rotulo="Bairro" erro={erros.bairro}>
              <input value={dados.endereco.bairro} onChange={(e) => mudaEnd({ bairro: e.target.value })} maxLength={80} aria-invalid={!!erros.bairro} />
            </Campo>
          </div>
          <div className="linha-campos">
            <Campo rotulo="Complemento (opcional)">
              <input value={dados.endereco.complemento} onChange={(e) => mudaEnd({ complemento: e.target.value })} maxLength={120} autoComplete="address-line2" />
            </Campo>
            <Campo rotulo="Ponto de referência (opcional)">
              <input value={dados.endereco.referencia} onChange={(e) => mudaEnd({ referencia: e.target.value })} maxLength={120} />
            </Campo>
          </div>
        </fieldset>
      )}

      <fieldset className="grupo">
        <legend>Pagamento</legend>
        <div className="chips">
          {PAGAMENTOS.map((p) => (
            <Chip key={p} ativo={dados.pagamento === p} onClick={() => muda({ pagamento: p })}>
              {p}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Campo rotulo="Observação (opcional)">
        <input value={dados.observacao} onChange={(e) => muda({ observacao: e.target.value })} maxLength={300} placeholder="Ex.: sem cebola, troco para 50" />
      </Campo>
    </div>
  );
}
