import { useEffect, useReducer, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Produto } from "../../domain/tipos";
import { calcularTotal, formatarBRL, precoUnitario } from "../../domain/pedido";
import { listarCardapio } from "../../services/produtos";
import { criarPedido } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { Botao } from "../../components/base";
import { carrinhoReducer, itensDoCarrinho } from "./carrinho";
import { ListaProdutos } from "../pedido/ListaProdutos";
import { FormDadosPedido } from "../pedido/FormDadosPedido";
import { paraEnvio, validarDados, type ErrosDados } from "../pedido/dados";
import { guardarDados, guardarPedido, meusDados, meusPedidos } from "./memoria";

/** Página do cliente: escolhe os itens, informa os dados e envia o pedido. */
export function CardapioPage() {
  const navegar = useNavigate();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erroCarga, setErroCarga] = useState("");
  const [carrinho, mudarCarrinho] = useReducer(carrinhoReducer, {});
  const [dados, setDados] = useState(meusDados);
  const [erros, setErros] = useState<ErrosDados>({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucessoSemId, setSucessoSemId] = useState(false);
  const [armadilha, setArmadilha] = useState("");
  const travaEnvio = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const ultimo = meusPedidos()[0];

  useEffect(() => {
    listarCardapio()
      .then(setProdutos)
      .catch((e) => setErroCarga(mensagemDeErro(e)));
  }, []);

  const itens = itensDoCarrinho(carrinho);
  const quantidade = itens.reduce((s, i) => s + i.quantidade, 0);
  const total = calcularTotal(
    itens.map((i) => {
      const p = produtos?.find((x) => x.id === i.produtoId);
      return { precoUnitario: p ? precoUnitario(p, i.tamanho) : 0, quantidade: i.quantidade };
    }),
  );

  async function enviar() {
    if (travaEnvio.current || !quantidade) return;
    setErroEnvio("");
    const e = validarDados(dados);
    setErros(e);
    if (Object.keys(e).length) {
      formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      return;
    }
    // Campo invisível preenchido = robô. Finge que deu certo e não grava nada.
    if (armadilha) {
      setSucessoSemId(true);
      return;
    }
    travaEnvio.current = true;
    setEnviando(true);
    try {
      const r = await criarPedido(paraEnvio(dados, itens));
      guardarPedido(r.id);
      guardarDados(dados);
      navegar(`/pedido/${r.id}`);
    } catch (err) {
      setErroEnvio(mensagemDeErro(err));
      travaEnvio.current = false;
      setEnviando(false);
    }
  }

  if (sucessoSemId) {
    return (
      <main className="conteudo">
        <h1>Pedido enviado!</h1>
      </main>
    );
  }

  return (
    <>
      <header className="topo topo--cliente borda-pastel borda-pastel--baixo">
        <div className="topo__linha">
          <h1 className="marca">Sabor de Pastel</h1>
          {ultimo && (
            <Link to={`/pedido/${ultimo}`} className="topo__link">
              Meu último pedido
            </Link>
          )}
        </div>
        <p className="topo__frase">Escolha, envie e acompanhe seu pedido por aqui.</p>
      </header>

      <main className="conteudo">
        {erroCarga && (
          <p className="campo__erro" role="alert">
            {erroCarga}
          </p>
        )}
        {produtos === null && !erroCarga && <p className="suave">Carregando o cardápio…</p>}
        {produtos && produtos.length === 0 && <p className="vazio">O cardápio está vazio agora. Volte mais tarde.</p>}
        {produtos && produtos.length > 0 && (
          <ListaProdutos produtos={produtos} carrinho={carrinho} aoMudar={(produtoId, tamanho, tipo) => mudarCarrinho({ tipo, produtoId, tamanho })} />
        )}

        {quantidade > 0 && (
          <div className="card" ref={formRef}>
            <h2>Seus dados</h2>
            <FormDadosPedido dados={dados} aoMudar={setDados} erros={erros} />
            <label className="visualmente-oculto" aria-hidden="true">
              Site
              <input name="site" tabIndex={-1} autoComplete="off" value={armadilha} onChange={(e) => setArmadilha(e.target.value)} />
            </label>
          </div>
        )}

        {erroEnvio && (
          <p className="campo__erro aviso-erro" role="alert">
            {erroEnvio}
          </p>
        )}

        <footer className="rodape">
          <Link to="/atendente">Área da equipe</Link>
        </footer>
      </main>

      {quantidade > 0 && (
        <div className="barra borda-pastel">
          <div className="barra__linha">
            <div className="barra__total">
              <span className="suave">{`${quantidade} ${quantidade > 1 ? "itens" : "item"}`}</span>
              <b>{formatarBRL(total)}</b>
            </div>
            <Botao carregando={enviando} onClick={enviar}>
              Enviar pedido
            </Botao>
          </div>
        </div>
      )}
    </>
  );
}
