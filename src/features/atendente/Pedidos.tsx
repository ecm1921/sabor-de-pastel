import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { Pedido, Status } from "../../domain/tipos";
import { hojeSP } from "../../domain/datas";
import { alterarStatus, assinarPedidosDoDia, listarPedidosDoDia } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { Botao, Chip, Modal } from "../../components/base";
import { useToast } from "../../components/Toast";
import { CartaoPedido } from "./CartaoPedido";
import { Comanda } from "./Comanda";
import { tocarAviso } from "./som";

type Filtro = "todos" | "novos" | "andamento" | "concluidos";

const FILTROS: { id: Filtro; rotulo: string; status: Status[] | null }[] = [
  { id: "todos", rotulo: "Todos", status: null },
  { id: "novos", rotulo: "Novos", status: ["recebido"] },
  { id: "andamento", rotulo: "Em andamento", status: ["preparando", "pronto"] },
  { id: "concluidos", rotulo: "Concluídos", status: ["entregue", "cancelado"] },
];

export function Pedidos() {
  const toast = useToast();
  const [dia] = useState(hojeSP);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [novos, setNovos] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<Pedido | null>(null);
  const [impressao, setImpressao] = useState<Pedido | null>(null);
  const conhecidos = useRef<Set<string> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const lista = await listarPedidosDoDia(dia);
      const antes = conhecidos.current;
      if (antes) {
        const chegaram = lista.filter((p) => !antes.has(p.id)).map((p) => p.id);
        if (chegaram.length) {
          setNovos((n) => new Set([...n, ...chegaram]));
          tocarAviso();
        }
      }
      conhecidos.current = new Set(lista.map((p) => p.id));
      setPedidos(lista);
      setErro("");
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [dia]);

  useEffect(() => {
    carregar();
    return assinarPedidosDoDia(dia, carregar);
  }, [dia, carregar]);

  async function mudar(p: Pedido, destino: Status) {
    setOcupado(p.id);
    setNovos((n) => {
      const c = new Set(n);
      c.delete(p.id);
      return c;
    });
    try {
      await alterarStatus(p.id, destino);
      await carregar();
    } catch (e) {
      toast(mensagemDeErro(e));
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  function imprimir(p: Pedido) {
    flushSync(() => setImpressao(p));
    window.print();
  }

  const doFiltro = FILTROS.find((f) => f.id === filtro)!;
  const visiveis = (pedidos ?? []).filter((p) => !doFiltro.status || doFiltro.status.includes(p.status));
  const contagem = (f: (typeof FILTROS)[number]) => (pedidos ?? []).filter((p) => !f.status || f.status.includes(p.status)).length;

  return (
    <section aria-labelledby="titulo-pedidos">
      <h1 id="titulo-pedidos" className="visualmente-oculto">
        Pedidos de hoje
      </h1>
      <div className="chips filtros">
        {FILTROS.map((f) => (
          <Chip key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.rotulo} ({contagem(f)})
          </Chip>
        ))}
      </div>

      {erro && (
        <p className="campo__erro" role="alert">
          {erro}{" "}
          <button type="button" className="link" onClick={carregar}>
            Tentar de novo
          </button>
        </p>
      )}
      {pedidos === null && !erro && <p className="suave">Carregando pedidos…</p>}
      {pedidos && visiveis.length === 0 && (
        <p className="vazio">{filtro === "todos" ? "Nenhum pedido hoje ainda. Os pedidos dos clientes aparecem aqui na hora." : "Nenhum pedido neste filtro."}</p>
      )}

      <div className="lista-pedidos">
        {visiveis.map((p) => (
          <CartaoPedido
            key={p.id}
            pedido={p}
            novo={novos.has(p.id)}
            ocupado={ocupado === p.id}
            aoAvancar={(s) => mudar(p, s)}
            aoCancelar={() => setCancelando(p)}
            aoImprimir={() => imprimir(p)}
          />
        ))}
      </div>

      <Modal aberto={!!cancelando} aoFechar={() => setCancelando(null)} titulo={`Cancelar o pedido nº ${cancelando?.numero ?? ""}?`}>
        <p>Ele sai do total do dia, mas continua na lista como cancelado.</p>
        <div className="linha-botoes">
          <Botao variante="secundario" onClick={() => setCancelando(null)}>
            Voltar
          </Botao>
          <Botao
            variante="perigo"
            onClick={() => {
              const p = cancelando!;
              setCancelando(null);
              mudar(p, "cancelado");
            }}
          >
            Cancelar pedido
          </Botao>
        </div>
      </Modal>

      {impressao && createPortal(<div className="area-impressao">{<Comanda pedido={impressao} />}</div>, document.body)}
    </section>
  );
}
