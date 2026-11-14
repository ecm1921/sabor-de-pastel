import { useCallback, useEffect, useState } from "react";
import { CATEGORIAS, type Categoria, type Produto } from "../../domain/tipos";
import { formatarBRL, lerPreco, precoParaCampo, temTamanho } from "../../domain/pedido";
import { definirAtivo, excluirProduto, listarProdutos, salvarProduto } from "../../services/produtos";
import { mensagemDeErro } from "../../services/erros";
import { Botao, Modal } from "../../components/base";
import { useToast } from "../../components/Toast";

interface Rascunho {
  id?: string;
  nome: string;
  categoria: Categoria;
  preco: string;
  preco_m: string;
  preco_g: string;
  ativo: boolean;
}

const novoRascunho = (): Rascunho => ({ nome: "", categoria: "Pastéis", preco: "", preco_m: "15,00", preco_g: "25,00", ativo: true });

const paraRascunho = (p: Produto): Rascunho => ({
  id: p.id,
  nome: p.nome,
  categoria: p.categoria,
  preco: precoParaCampo(p.preco),
  preco_m: precoParaCampo(p.preco_m),
  preco_g: precoParaCampo(p.preco_g),
  ativo: p.ativo,
});

const ERRO_PRECO = "Digite um preço, por exemplo 15,00.";

/** Cardápio (só admin): criar, editar preço, marcar esgotado e excluir. */
export function Cardapio() {
  const toast = useToast();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    listarProdutos()
      .then((l) => (setProdutos(l), setErro("")))
      .catch((e) => setErro(mensagemDeErro(e)));
  }, []);
  useEffect(carregar, [carregar]);

  function abrir(r: Rascunho) {
    setEditando(r);
    setErrosForm({});
    setConfirmarExclusao(false);
  }

  async function salvar() {
    if (!editando) return;
    const pastel = editando.categoria === "Pastéis";
    const e: Record<string, string> = {};
    const nome = editando.nome.trim().replace(/\s+/g, " ");
    if (!nome) e.nome = "Digite o nome do item.";
    const preco = lerPreco(editando.preco);
    const precoM = lerPreco(editando.preco_m);
    const precoG = lerPreco(editando.preco_g);
    if (pastel && precoM === null) e.preco_m = ERRO_PRECO;
    if (pastel && precoG === null) e.preco_g = ERRO_PRECO;
    if (!pastel && preco === null) e.preco = ERRO_PRECO;
    setErrosForm(e);
    if (Object.keys(e).length) return;

    setSalvando(true);
    try {
      await salvarProduto({
        ...(editando.id ? { id: editando.id } : {}),
        nome,
        categoria: editando.categoria,
        preco: pastel ? null : preco,
        preco_m: pastel ? precoM : null,
        preco_g: pastel ? precoG : null,
        ativo: editando.ativo,
      });
      toast(editando.id ? "Item salvo" : "Item adicionado");
      setEditando(null);
      carregar();
    } catch (err) {
      toast(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!editando?.id) return;
    try {
      const r = await excluirProduto(editando.id);
      toast(r === "desativado" ? "Item desativado porque já tem vendas" : "Item excluído");
      setEditando(null);
      carregar();
    } catch (err) {
      toast(mensagemDeErro(err));
    }
  }

  async function alternar(p: Produto) {
    setProdutos((l) => l?.map((x) => (x.id === p.id ? { ...x, ativo: !p.ativo } : x)) ?? l);
    try {
      await definirAtivo(p.id, !p.ativo);
    } catch (err) {
      toast(mensagemDeErro(err));
      carregar();
    }
  }

  const campo = (k: keyof Rascunho, rotulo: string) => (
    <label className="campo">
      <span>{rotulo}</span>
      <input
        value={String(editando?.[k] ?? "")}
        inputMode={k === "nome" ? undefined : "decimal"}
        aria-invalid={!!errosForm[k]}
        onChange={(e) => setEditando((r) => (r ? { ...r, [k]: e.target.value } : r))}
      />
      {errosForm[k] && <span className="campo__erro">{errosForm[k]}</span>}
    </label>
  );

  return (
    <section aria-labelledby="titulo-cardapio">
      <div className="cabecalho-secao">
        <div>
          <h1 id="titulo-cardapio" className="titulo-secao">
            Cardápio
          </h1>
          <p className="suave">Toque em um item para editar. Use a chave para marcar como esgotado.</p>
        </div>
        <Botao onClick={() => abrir(novoRascunho())}>Novo item</Botao>
      </div>

      {erro && (
        <p className="campo__erro" role="alert">
          {erro}
        </p>
      )}
      {!produtos && !erro && <p className="suave">Carregando…</p>}
      {produtos?.length === 0 && <p className="vazio">Nenhum item cadastrado. Toque em Novo item para começar.</p>}

      {CATEGORIAS.map((cat) => {
        const doGrupo = (produtos ?? []).filter((p) => p.categoria === cat);
        if (!doGrupo.length) return null;
        return (
          <div key={cat} className="cardapio__grupo">
            <h2>{cat}</h2>
            <ul className="lista-admin">
              {doGrupo.map((p) => (
                <li key={p.id} data-esgotado={!p.ativo || undefined}>
                  <button type="button" className="lista-admin__item" aria-label={`Editar ${p.nome}`} onClick={() => abrir(paraRascunho(p))}>
                    <span className="lista-admin__nome">{p.nome}</span>
                    <span className="preco">
                      {temTamanho(p) ? `M ${formatarBRL(p.preco_m ?? 0)} · G ${formatarBRL(p.preco_g ?? 0)}` : formatarBRL(p.preco ?? 0)}
                    </span>
                  </button>
                  <label className="chave">
                    <input type="checkbox" role="switch" checked={p.ativo} aria-label={`${p.nome} disponível`} onChange={() => alternar(p)} />
                    <span aria-hidden="true" />
                    <small>{p.ativo ? "Disponível" : "Esgotado"}</small>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={confirmarExclusao ? `Excluir ${editando?.nome}?` : editando?.id ? "Editar item" : "Novo item"}>
        {editando && !confirmarExclusao && (
          <>
            {campo("nome", "Nome")}
            <label className="campo">
              <span>Categoria</span>
              <select value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value as Categoria })}>
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {editando.categoria === "Pastéis" ? (
              <div className="linha-campos">
                {campo("preco_m", "Preço M (R$)")}
                {campo("preco_g", "Preço G (R$)")}
              </div>
            ) : (
              campo("preco", "Preço (R$)")
            )}
            <div className="linha-botoes">
              {editando.id && (
                <Botao variante="perigo" onClick={() => setConfirmarExclusao(true)}>
                  Excluir
                </Botao>
              )}
              <Botao variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Botao>
              <Botao carregando={salvando} onClick={salvar}>
                Salvar
              </Botao>
            </div>
          </>
        )}
        {editando && confirmarExclusao && (
          <>
            <p>Se o item já foi vendido, ele fica desativado em vez de sumir, para não mexer nas vendas antigas.</p>
            <div className="linha-botoes">
              <Botao variante="secundario" onClick={() => setConfirmarExclusao(false)}>
                Voltar
              </Botao>
              <Botao variante="perigo" onClick={excluir}>
                Excluir item
              </Botao>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
