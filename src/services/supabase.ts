import { createClient } from "@supabase/supabase-js";

// Chave pública (anon). A segurança está nas regras do banco (RLS), não aqui.
const url = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || "chave-ausente";

export const supabase = createClient(url, chave, {
  // PKCE evita tokens no # da URL (o HashRouter usa o #). A recuperação de senha usa ?token_hash= (auth/Recuperacao.tsx).
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
});
