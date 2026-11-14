import { useEffect, useState } from "react";
import type { LogAcao } from "../../domain/tipos";
import { hojeSP } from "../../domain/datas";
import { descreverAcao } from "../../domain/log";
import { listarLog, listarPerfis } from "../../services/log";
import { mensagemDeErro } from "../../services/erros";

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Log de ações (só admin): quem fez o quê, filtrando por pessoa e dia. */
export function Log() {
  const [dia, setDia] = useState(hojeSP);
  const [perfilId, setPerfilId] = useState("");
  const [perfis, setPerfis] = useState<{ id: string; usuario: string; nome: string }[]>([]);
  const [linhas, setLinhas] = useState<LogAcao[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarPerfis()
      .then(setPerfis)
      .catch(() => setPerfis([]));
  }, []);

  useEffect(() => {
    let ativo = true;
    setLinhas(null);
    listarLog({ dia, ...(perfilId ? { perfilId } : {}) })
      .then((l) => ativo && (setLinhas(l), setErro("")))
      .catch((e) => ativo && setErro(mensagemDeErro(e)));
    return () => {
      ativo = false;
    };
  }, [dia, perfilId]);

  return (
    <section aria-labelledby="titulo-log">
      <h1 id="titulo-log" className="titulo-secao">
        Log de ações
      </h1>
      <div className="card linha-campos">
        <label className="campo">
          <span>Dia</span>
          <input type="date" value={dia} max={hojeSP()} onChange={(e) => e.target.value && setDia(e.target.value)} />
        </label>
        <label className="campo">
          <span>Pessoa</span>
          <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
            <option value="">Todas</option>
            {perfis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.usuario})
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro && (
        <p className="campo__erro" role="alert">
          {erro}
        </p>
      )}
      {!linhas && !erro && <p className="suave">Carregando…</p>}
      {linhas?.length === 0 && <p className="vazio">Nenhuma ação registrada com esses filtros.</p>}

      {linhas && linhas.length > 0 && (
        <ol className="log">
          {linhas.map((l) => (
            <li key={l.id} data-acao={l.acao}>
              <time dateTime={l.quando}>{hora(l.quando)}</time>
              <span>{descreverAcao(l)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
