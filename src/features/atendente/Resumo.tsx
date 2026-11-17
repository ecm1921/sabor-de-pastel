import { useEffect, useState } from "react";
import type { Pedido } from "../../domain/tipos";
import { PAGAMENTOS } from "../../domain/tipos";
import { formatarBRL } from "../../domain/pedido";
import { hojeSP } from "../../domain/datas";
import { gerarCsv, resumirDia } from "../../domain/resumo";
import { listarPedidosDoDia } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { Botao } from "../../components/base";
import { useToast } from "../../components/Toast";

export function Resumo() {
  const toast = useToast();
  const [dia, setDia] = useState(hojeSP);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState("");
  const [csvVisivel, setCsvVisivel] = useState("");

  useEffect(() => {
    let ativo = true;
    setPedidos(null);
    setCsvVisivel("");
    listarPedidosDoDia(dia)
      .then((l) => ativo && (setPedidos(l), setErro("")))
      .catch((e) => ativo && setErro(mensagemDeErro(e)));
    return () => {
      ativo = false;
    };
  }, [dia]);

  const r = pedidos ? resumirDia(pedidos) : null;
  const maior = r?.maisVendidos[0]?.quantidade ?? 1;

  async function copiar() {
    const csv = gerarCsv(pedidos ?? []);
    try {
      await navigator.clipboard.writeText(csv);
      toast("Vendas copiadas");
    } catch {
      setCsvVisivel(csv);
      toast("Selecione o texto e copie");
    }
  }

  return (
    <section aria-labelledby="titulo-resumo">
      <h1 id="titulo-resumo" className="visualmente-oculto">
        Resumo do dia
      </h1>
      <div className="card">
        <label className="campo" style={{ marginBottom: 0 }}>
          <span>Dia</span>
          <input type="date" value={dia} max={hojeSP()} onChange={(e) => e.target.value && setDia(e.target.value)} />
        </label>
      </div>

      {erro && (
        <p className="campo__erro" role="alert">
          {erro}
        </p>
      )}
      {!r && !erro && <p className="suave">Carregando…</p>}

      {r && (
        <>
          <div className="kpis">
            <div className="kpi kpi--destaque" data-testid="kpi-total">
              <span>Total vendido</span>
              <b>{formatarBRL(r.total)}</b>
            </div>
            <div className="kpi">
              <span>Pedidos</span>
              <b>{r.quantidade}</b>
            </div>
            <div className="kpi">
              <span>Ticket médio</span>
              <b>{formatarBRL(r.ticketMedio)}</b>
            </div>
            <div className="kpi">
              <span>Pastéis vendidos</span>
              <b>{r.pasteis}</b>
            </div>
          </div>
          {r.cancelados > 0 && (
            <p className="suave">
              {r.cancelados} {r.cancelados > 1 ? "pedidos cancelados não entram" : "pedido cancelado não entra"} nas somas.
            </p>
          )}

          <div className="card">
            <h2>Por forma de pagamento</h2>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Forma</th>
                  <th className="num">Pedidos</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {PAGAMENTOS.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="num">{r.porPagamento[f].quantidade}</td>
                    <td className="num">{formatarBRL(r.porPagamento[f].valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Mais vendidos</h2>
            {r.maisVendidos.length === 0 && <p className="suave">Sem vendas neste dia.</p>}
            <ul className="barras">
              {r.maisVendidos.map((m) => (
                <li key={m.nome}>
                  <span className="barras__rotulo">
                    <span>{m.nome}</span>
                    <b>{m.quantidade}</b>
                  </span>
                  <span className="barras__trilho" aria-hidden="true">
                    <i style={{ width: `${(m.quantidade / maior) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <p className="suave nota">Use esta lista para planejar a compra de recheio e massa do dia seguinte.</p>
          </div>

          <div className="card">
            <h2>Exportar vendas</h2>
            <p className="suave">Copia os pedidos do dia em formato de planilha (CSV) para guardar ou colar no Excel.</p>
            <Botao variante="secundario" onClick={copiar} disabled={!pedidos?.length}>
              Copiar vendas do dia
            </Botao>
            {csvVisivel && <textarea className="csv" readOnly rows={6} value={csvVisivel} onFocus={(e) => e.target.select()} />}
          </div>
        </>
      )}
    </section>
  );
}
