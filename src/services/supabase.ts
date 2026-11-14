import { createClient } from "@supabase/supabase-js";

// Chave pública (anon). A segurança está nas regras do banco (RLS), não aqui.
const url = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || "chave-ausente";

export const supabase = createClient(url, chave, {
  // PKCE: o link de recuperação de senha volta com ?code= (o HashRouter usa o # da URL).
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
});
