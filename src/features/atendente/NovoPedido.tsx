import { useEffect, useReducer, useState } from "react";
import type { Produto } from "../../domain/tipos";
import { calcularTotal, formatarBRL, precoUnitario } from "../../domain/pedido";
import { listarCardapio } from "../../services/produtos";
import { criarPedido } from "../../services/pedidos";
import { mensagemDeErro } from "../../services/erros";
import { Botao } from "../../components/base";
import { useToast } from "../../components/Toast";
import { carrinhoReducer, itensDoCarrinho } from "../cliente/carrinho";
import { ListaProdutos } from "../pedido/ListaProdutos";
import { FormDadosPedido } from "../pedido/FormDadosPedido";
import { dadosVazios, paraEnvio, validarDados, type ErrosDados } from "../pedido/dados";

/** Pedido feito no balcão pelo atendente (cliente presente ou por telefone). */
export function NovoPedido() {
  const toast = useToast();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erroCarga, setErroCarga] = useState("");
  const [carrinho, mudarCarrinho] = useReducer(carrinhoReducer, {});
  const [dados, setDados] = useState(dadosVazios);
  const [erros, setErros] = useState<ErrosDados>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarCardapio()
      .then(setProdutos)
      .catch((e) => setErroCarga(mensagemDeErro(e)));
  }, []);

  const itens = itensDoCarrinho(carrinho);
  const total = calcularTotal(
    itens.map((i) => {
      const p = produtos?.find((x) => x.id === i.produtoId);
      return { precoUnitario: p ? precoUnitario(p, i.tamanho) : 0, quantidade: i.quantidade };
    }),
  );
  const quantidade = itens.reduce((s, i) => s + i.quantidade, 0);

  async function registrar() {
    const e = validarDados(dados, total);
    setErros(e);
    if (Object.keys(e).length) {
      toast("Confira os campos destacados");
      return;
    }
    setEnviando(true);
    try {
      const r = await criarPedido(paraEnvio(dados, itens, total));
      toast(`Pedido nº ${r.numero} registrado`);
      mudarCarrinho({ tipo: "limpar" });
      setDados(dadosVazios());
    } catch (err) {
      toast(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-novo">
      <h1 id="titulo-novo" className="visualmente-oculto">
        Novo pedido
      </h1>
      {erroCarga && (
        <p className="campo__erro" role="alert">
          {erroCarga}
        </p>
      )}
      {produtos === null && !erroCarga && <p className="suave">Carregando cardápio…</p>}
      {produtos && produtos.length === 0 && <p className="vazio">Nenhum item disponível. Cadastre itens na aba Cardápio.</p>}
      {produtos && (
        <ListaProdutos produtos={produtos} carrinho={carrinho} aoMudar={(produtoId, tamanho, tipo) => mudarCarrinho({ tipo, produtoId, tamanho })} />
      )}

      <div className="card">
        <FormDadosPedido dados={dados} aoMudar={setDados} erros={erros} total={total} />
      </div>

      <div className="barra borda-pastel">
        <div className="barra__linha">
          <div className="barra__total">
            <span className="suave">{quantidade ? `${quantidade} ${quantidade > 1 ? "itens" : "item"}` : "Nenhum item"}</span>
            <b>{formatarBRL(total)}</b>
          </div>
          <Botao
            variante="secundario"
            disabled={!quantidade}
            onClick={() => {
              mudarCarrinho({ tipo: "limpar" });
              setDados(dadosVazios());
              setErros({});
            }}
          >
            Limpar
          </Botao>
          <Botao disabled={!quantidade} carregando={enviando} onClick={registrar}>
            Registrar
          </Botao>
        </div>
      </div>
    </section>
  );
}
