import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Produto } from "../../domain/tipos";
import { calcularTotal, formatarBRL, precoUnitario } from "../../domain/pedido";
import { novoId } from "../../domain/id";
import { listarCardapio } from "../../services/produtos";
import { criarPedido } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { Botao } from "../../components/base";
import { carrinhoReducer, itensDoCarrinho } from "./carrinho";
import { ListaProdutos } from "../pedido/ListaProdutos";
import { FormDadosPedido } from "../pedido/FormDadosPedido";
import { paraEnvio, validarDados, type ErrosDados } from "../pedido/dados";
import { guardarDados, guardarPedido, meusDados, meusPedidos } from "./memoria";
import fotoRefri from "../../assets/fotos/refrigerante.webp";
import fotoPilha from "../../assets/fotos/pilha-pasteis.webp";
import fotoDireita from "../../assets/fotos/pastel-suco.webp";

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
  // Código do pedido em envio. Se a internet cair, a nova tentativa usa o mesmo código e o banco não duplica.
  // Mudou o carrinho ou os dados? Vira outro pedido.
  const codigoEnvio = useRef<string | null>(null);
  useEffect(() => {
    codigoEnvio.current = null;
  }, [carrinho, dados]);
  const formRef = useRef<HTMLDivElement>(null);
  const cardapioRef = useRef<HTMLElement>(null);
  // O app usa rotas com "#", então a âncora rola a página por código.
  const irParaCardapio = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    cardapioRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
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
      codigoEnvio.current ??= novoId();
      const r = await criarPedido({ ...paraEnvio(dados, itens), id: codigoEnvio.current });
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
      <header className="barra-topo">
        <nav className="barra-topo__links" aria-label="Principal">
          <a href="#cardapio" onClick={irParaCardapio}>
            Cardápio
          </a>
          {ultimo && <Link to={`/pedido/${ultimo}`}>Meu pedido</Link>}
        </nav>
        <h1 className="barra-topo__marca">Sabor de Pastel</h1>
        <Link to="/atendente" className="barra-topo__equipe" aria-label="Área da equipe">
          Equipe
        </Link>
      </header>

      <section className="banner" aria-label="Destaque">
        <img className="banner__foto banner__foto--refri" src={fotoRefri} alt="" />
        <img className="banner__foto banner__foto--pilha" src={fotoPilha} alt="" />
        <img className="banner__foto banner__foto--direita" src={fotoDireita} alt="" />
        <div className="banner__texto">
          <p className="banner__titulo">
            <span className="visualmente-oculto">Peça seu pastel sem fila</span>
            <span aria-hidden="true">
              <Letras texto="Peça seu pastel" />{" "}
              <span className="banner__circulo">
                <Letras texto="sem fila" inicio={15} />
              </span>
            </span>
          </p>
          <p className="banner__frase">Escolha, envie e acompanhe seu pedido por aqui.</p>
          <div className="banner__acoes">
            <a className="botao botao--amarelo" href="#cardapio" onClick={irParaCardapio}>
              Ver cardápio
            </a>
            {ultimo && (
              <Link className="botao botao--contorno-claro" to={`/pedido/${ultimo}`}>
                Acompanhar pedido
              </Link>
            )}
          </div>
        </div>
      </section>
      <div className="banner__borda" aria-hidden="true" />

      <main className="conteudo" id="cardapio" ref={cardapioRef}>
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

/** Título do banner letra por letra, para a animação de entrada e a onda.
 *  Cada palavra fica num bloco que não quebra no meio. */
function Letras({ texto, inicio = 0 }: { texto: string; inicio?: number }) {
  let n = inicio;
  const palavras = texto.split(" ");
  return (
    <>
      {palavras.map((palavra, i) => (
        <span key={i}>
          <span className="palavra">
            {[...palavra].map((letra, j) => (
              <span key={j} className="letra" style={{ "--i": n++ } as CSSProperties}>
                {letra}
              </span>
            ))}
          </span>
          {i < palavras.length - 1 && " "}
        </span>
      ))}
    </>
  );
}
