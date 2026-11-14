import type { ReactNode } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { RequireAuth } from "../../auth/RequireAuth";
import { Pedidos } from "./Pedidos";
import { NovoPedido } from "./NovoPedido";

interface Aba {
  caminho: string;
  rotulo: string;
  so_admin?: boolean;
  tela: ReactNode;
}

const EM_BREVE = <p className="vazio">Esta parte chega na próxima versão do app.</p>;

/** Abas da equipe. Cardápio e Log só aparecem para o admin. */
export const ABAS: Aba[] = [
  { caminho: "pedidos", rotulo: "Pedidos", tela: <Pedidos /> },
  { caminho: "novo", rotulo: "Novo pedido", tela: <NovoPedido /> },
  { caminho: "resumo", rotulo: "Resumo", tela: EM_BREVE },
  { caminho: "cardapio", rotulo: "Cardápio", so_admin: true, tela: EM_BREVE },
  { caminho: "log", rotulo: "Log", so_admin: true, tela: EM_BREVE },
];

export function AtendenteLayout() {
  const { perfil, sair } = useAuth();
  const abas = ABAS.filter((a) => !a.so_admin || perfil?.papel === "admin");

  return (
    <>
      <header className="topo topo--equipe borda-pastel borda-pastel--baixo">
        <div className="topo__linha">
          <p className="marca">Sabor de Pastel</p>
          <div className="topo__usuario">
            <span>{perfil?.nome}</span>
            <button type="button" className="topo__link link-claro" onClick={sair}>
              Sair
            </button>
          </div>
        </div>
        <nav className="abas" aria-label="Seções da equipe">
          {abas.map((a) => (
            <NavLink key={a.caminho} to={`/atendente/${a.caminho}`} className="aba">
              {a.rotulo}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="conteudo">
        <Routes>
          <Route index element={<Navigate to="pedidos" replace />} />
          {ABAS.map((a) => (
            <Route
              key={a.caminho}
              path={a.caminho}
              element={a.so_admin ? <RequireAuth papel="admin">{a.tela}</RequireAuth> : a.tela}
            />
          ))}
        </Routes>
      </main>
    </>
  );
}
