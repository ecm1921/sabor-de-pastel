import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Botao } from "../components/base";
import { mensagemDeErro } from "../services/erros";
import { recuperarSenha } from "../services/auth";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState((local.state as { aviso?: string } | null)?.aviso ?? "");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);

  async function aoEntrar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(usuario, senha);
      const destino = (local.state as { de?: string } | null)?.de ?? "/atendente";
      navegar(destino, { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function aoRecuperar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await recuperarSenha(usuario);
      setAviso("Se o usuário existir, enviamos um link para o e-mail cadastrado.");
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-login">
      <header className="topo borda-pastel borda-pastel--baixo">
        <div className="topo__linha">
          <p className="marca">Sabor de Pastel</p>
          <Link to="/" className="topo__link">
            Ver cardápio
          </Link>
        </div>
      </header>
      <main className="conteudo conteudo--estreito">
        <h1>{modoRecuperar ? "Recuperar senha" : "Entrar na equipe"}</h1>
        <form className="card" onSubmit={modoRecuperar ? aoRecuperar : aoEntrar} noValidate>
          <label className="campo">
            <span>Usuário</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </label>
          {!modoRecuperar && (
            <label className="campo">
              <span>Senha</span>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
            </label>
          )}
          {erro && (
            <p className="campo__erro" role="alert">
              {erro}
            </p>
          )}
          {aviso && <p role="status">{aviso}</p>}
          <Botao type="submit" largo carregando={enviando} disabled={!usuario || (!modoRecuperar && !senha)}>
            {modoRecuperar ? "Enviar link" : "Entrar"}
          </Botao>
        </form>
        <p>
          <button
            type="button"
            className="link"
            onClick={() => {
              setModoRecuperar(!modoRecuperar);
              setErro("");
              setAviso("");
            }}
          >
            {modoRecuperar ? "Voltar para o login" : "Esqueci minha senha"}
          </button>
        </p>
      </main>
    </div>
  );
}
