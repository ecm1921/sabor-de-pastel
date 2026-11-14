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

/** Quem chega pelo link de "esqueci minha senha" (…/?recuperar=1&code=…) vai para a tela de nova senha. */
function tratarVoltaDaRecuperacao() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("recuperar")) return;
  window.history.replaceState(null, "", `${import.meta.env.BASE_URL}#/atendente/nova-senha`);
}

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
    // O Supabase troca o ?code= do link de recuperação por uma sessão antes de getSession() responder.
    supabase.auth.getSession().finally(() => {
      tratarVoltaDaRecuperacao();
      atualizar();
    });
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") setPerfil(null);
      if (evento === "PASSWORD_RECOVERY") window.location.hash = "#/atendente/nova-senha";
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
