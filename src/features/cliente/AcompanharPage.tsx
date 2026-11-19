import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Pedido } from "../../domain/tipos";
import { formatarBRL } from "../../domain/pedido";
import { formatarEndereco, linkWhatsApp, mensagemPedidoParaLoja } from "../../domain/whatsapp";
import { assinarStatusDoPedido, obterPedidoCliente } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { numeroLoja } from "../../config";
import { AndamentoPedido } from "./AndamentoPedido";

/** O cliente acompanha o pedido. O status muda sozinho quando a pastelaria atualiza. */
export function AcompanharPage() {
  const { id = "" } = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [estado, setEstado] = useState<"carregando" | "ok" | "nao-encontrado" | "erro">("carregando");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    obterPedidoCliente(id)
      .then((p) => {
        if (!ativo) return;
        setPedido(p);
        setEstado(p ? "ok" : "nao-encontrado");
      })
      .catch((e) => {
        if (!ativo) return;
        setErro(mensagemDeErro(e));
        setEstado("erro");
      });
    const parar = assinarStatusDoPedido(id, (status) => setPedido((p) => (p ? { ...p, status } : p)));
    return () => {
      ativo = false;
      parar();
    };
  }, [id]);

  return (
    <>
      <header className="topo borda-pastel borda-pastel--baixo">
        <div className="topo__linha">
          <p className="marca">Sabor de Pastel</p>
          <Link to="/" className="topo__link">
            Fazer outro pedido
          </Link>
        </div>
      </header>
      <main className="conteudo conteudo--estreito">
        {estado === "carregando" && <p className="suave">Carregando seu pedido…</p>}
        {estado === "erro" && (
          <p className="campo__erro" role="alert">
            {erro}
          </p>
        )}
        {estado === "nao-encontrado" && (
          <p className="vazio">
            Não encontramos esse pedido. <Link to="/">Voltar ao cardápio</Link>
          </p>
        )}
        {pedido && <Detalhe pedido={pedido} />}
      </main>
    </>
  );
}

function Detalhe({ pedido: p }: { pedido: Pedido }) {
  return (
    <>
      <h1>Pedido nº {p.numero}</h1>

      {p.status === "cancelado" ? (
        <p className="aviso-erro" role="status">
          Este pedido foi cancelado. Se precisar, fale com a pastelaria pelo WhatsApp.
        </p>
      ) : (
        <AndamentoPedido status={p.status} tipo={p.tipo} />
      )}

      <a className="botao botao--whats botao--largo" href={linkWhatsApp(numeroLoja(), mensagemPedidoParaLoja(p))} target="_blank" rel="noreferrer">
        Enviar pelo WhatsApp
      </a>
      <p className="suave nota">Seu pedido já chegou na pastelaria. O WhatsApp é só para vocês conversarem, se precisar.</p>

      <div className="card">
        <h2>Resumo</h2>
        <ul className="resumo-itens">
          {p.itens.map((i, n) => (
            <li key={n}>
              <span>
                {i.quantidade}x {i.nome}
                {i.tamanho ? ` (${i.tamanho})` : ""}
              </span>
              <span>{formatarBRL(i.precoUnitario * i.quantidade)}</span>
            </li>
          ))}
        </ul>
        <p className="resumo-total">
          <span>Total</span>
          <b>{formatarBRL(p.total)}</b>
        </p>
        <p>
          {p.tipo} · {p.pagamento}
        </p>
        {p.endereco && <p>{formatarEndereco(p.endereco)}</p>}
        {p.observacao && <p>Obs.: {p.observacao}</p>}
      </div>
    </>
  );
}
