import { CATEGORIAS, type Produto, type Tamanho } from "../../domain/tipos";
import { formatarBRL, temTamanho } from "../../domain/pedido";
import { Quantidade } from "../../components/Quantidade";
import { chaveItem, type Carrinho } from "../cliente/carrinho";

interface Props {
  produtos: Produto[];
  carrinho: Carrinho;
  aoMudar: (produtoId: string, tamanho: Tamanho | null, tipo: "mais" | "menos") => void;
}

/** Cardápio por categoria, com M/G nos pastéis e botões de quantidade. */
export function ListaProdutos({ produtos, carrinho, aoMudar }: Props) {
  const qtd = (id: string, t: Tamanho | null) => carrinho[chaveItem(id, t)]?.quantidade ?? 0;

  return (
    <div className="cardapio">
      {CATEGORIAS.map((cat) => {
        const doGrupo = produtos.filter((p) => p.categoria === cat);
        if (!doGrupo.length) return null;
        return (
          <section key={cat} className="cardapio__grupo" aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`}>{cat}</h2>
            <ul className="cardapio__lista">
              {doGrupo.map((p) => {
                const opcoes: { t: Tamanho | null; preco: number | null; rotulo: string }[] = temTamanho(p)
                  ? [
                      { t: "M", preco: p.preco_m, rotulo: "Médio" },
                      { t: "G", preco: p.preco_g, rotulo: "Grande" },
                    ]
                  : [{ t: null, preco: p.preco, rotulo: "" }];
                const escolhido = opcoes.some((o) => qtd(p.id, o.t) > 0);
                return (
                  <li key={p.id} className="produto" data-escolhido={escolhido || undefined}>
                    <p className="produto__nome">{p.nome}</p>
                    {opcoes.map((o) => {
                      const rotulo = o.t ? `${p.nome} ${o.t}` : p.nome;
                      return (
                        <div key={o.t ?? "unico"} className="produto__opcao">
                          <span>
                            {o.rotulo && <span className="produto__tam">{o.rotulo}</span>}
                            <span className="preco">{formatarBRL(o.preco ?? 0)}</span>
                          </span>
                          <Quantidade
                            valor={qtd(p.id, o.t)}
                            rotulo={rotulo}
                            aoMudar={(novo) => aoMudar(p.id, o.t, novo > qtd(p.id, o.t) ? "mais" : "menos")}
                          />
                        </div>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
