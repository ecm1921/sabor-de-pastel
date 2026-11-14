import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { confirmarLinkRecuperacao } from "../services/auth";
import { supabase } from "../services/supabase";

export const AVISO_LINK_INVALIDO = "O link para trocar a senha venceu ou já foi usado. Peça um novo em Esqueci minha senha.";

/** Quem chega pelo link de "esqueci minha senha" vai direto para a tela de nova senha. Fica dentro do roteador. */
export function Recuperacao() {
  const navegar = useNavigate();

  useEffect(() => {
    let ativo = true;
    confirmarLinkRecuperacao(window.location.search)
      .catch(() => "invalido" as const)
      .then((r) => {
        if (!ativo || !r) return;
        // Tira o código do endereço (ele só vale uma vez).
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
        if (r === "ok") navegar("/atendente/nova-senha", { replace: true });
        else navegar("/atendente/login", { replace: true, state: { aviso: AVISO_LINK_INVALIDO } });
      });
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") navegar("/atendente/nova-senha", { replace: true });
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [navegar]);

  return null;
}
