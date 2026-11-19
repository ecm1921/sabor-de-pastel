import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Botao } from "../components/base";
import { definirNovaSenha } from "../services/auth";
import { mensagemDeErro } from "../services/erros";
import { useToast } from "../components/Toast";

export function NovaSenhaPage() {
  const navegar = useNavigate();
  const toast = useToast();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirma) return setErro("As duas senhas não são iguais.");
    setEnviando(true);
    try {
      await definirNovaSenha(senha);
      toast("Senha alterada");
      navegar("/atendente", { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="topo borda-pastel borda-pastel--baixo">
        <div className="topo__linha">
          <p className="marca">Sabor de Pastel</p>
          <Link to="/atendente" className="topo__link">
            Voltar
          </Link>
        </div>
      </header>
      <main className="conteudo conteudo--estreito">
        <h1>Nova senha</h1>
        <form className="card" onSubmit={salvar} noValidate>
          <label className="campo">
            <span>Nova senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="campo">
            <span>Repita a nova senha</span>
            <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
          </label>
          {erro && (
            <p className="campo__erro" role="alert">
              {erro}
            </p>
          )}
          <Botao type="submit" largo carregando={enviando}>
            Salvar senha
          </Botao>
        </form>
      </main>
    </>
  );
}
