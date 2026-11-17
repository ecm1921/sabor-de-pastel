import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Papel } from "../domain/tipos";
import { useAuth } from "./AuthProvider";

/** Só mostra o conteúdo para quem está logado (e, se pedido, com o papel certo). */
export function RequireAuth({ papel, children }: { papel?: Papel; children: ReactNode }) {
  const { perfil, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <p className="conteudo suave">Carregando…</p>;
  if (!perfil) return <Navigate to="/atendente/login" replace state={{ de: local.pathname }} />;
  if (papel && perfil.papel !== papel) {
    return (
      <p className="conteudo" role="alert">
        Você não tem permissão para isso.
      </p>
    );
  }
  return <>{children}</>;
}
