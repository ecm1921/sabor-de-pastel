import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Perfil } from "../domain/tipos";
import * as auth from "../services/auth";
import { supabase } from "../services/supabase";

interface ValorAuth {
  perfil: Perfil | null;
  carregando: boolean;
  entrar: (usuario: string, senha: string) => Promise<Perfil>;
  sair: () => Promise<void>;
}

export const ContextoAuth = createContext<ValorAuth>({
  perfil: null,
  carregando: true,
  entrar: async () => {
    throw new Error("AuthProvider ausente");
  },
  sair: async () => {},
});

export const useAuth = () => useContext(ContextoAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const atualizar = async () => {
      const p = await auth.perfilAtual().catch(() => null);
      if (ativo) {
        setPerfil(p);
        setCarregando(false);
      }
    };
    atualizar();
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") setPerfil(null);
      // Entrou por link de recuperação, trocou a senha ou renovou a sessão: confere o perfil de novo
      // (um perfil desativado perde o acesso aqui). Fora do callback, como pede o supabase-js.
      if (evento === "SIGNED_IN" || evento === "USER_UPDATED" || evento === "TOKEN_REFRESHED") setTimeout(atualizar, 0);
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback(async (usuario: string, senha: string) => {
    const p = await auth.entrar(usuario, senha);
    setPerfil(p);
    return p;
  }, []);

  const sair = useCallback(async () => {
    await auth.sair();
    setPerfil(null);
  }, []);

  return <ContextoAuth.Provider value={{ perfil, carregando, entrar, sair }}>{children}</ContextoAuth.Provider>;
}
