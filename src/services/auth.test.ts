import { it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const signInWithPassword = vi.fn();
const resetPasswordForEmail = vi.fn();
vi.mock("./supabase", () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    auth: {
      signInWithPassword: (...a: unknown[]) => signInWithPassword(...a),
      resetPasswordForEmail: (...a: unknown[]) => resetPasswordForEmail(...a),
    },
  },
}));

import { entrar, recuperarSenha } from "./auth";
import { mensagemDeErro } from "./erros";

beforeEach(() => {
  rpc.mockReset();
  signInWithPassword.mockReset();
  resetPasswordForEmail.mockReset();
});

it("usuário inexistente dá o mesmo erro de senha incorreta", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  const erro = await entrar("ninguem", "123456").catch((e) => e);
  expect(mensagemDeErro(erro)).toBe("Usuário ou senha incorretos.");
  expect(signInWithPassword).not.toHaveBeenCalled();
});

it("entrar busca o e-mail do usuário e autentica com ele", async () => {
  rpc.mockResolvedValue({ data: "joao@teste.local", error: null });
  signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
  const erro = await entrar("  Joao ", "errada").catch((e) => e);
  expect(rpc).toHaveBeenCalledWith("email_do_usuario", { p_usuario: "joao" });
  expect(signInWithPassword).toHaveBeenCalledWith({ email: "joao@teste.local", password: "errada" });
  expect(mensagemDeErro(erro)).toBe("Usuário ou senha incorretos.");
});

it("recuperar senha de usuário inexistente não avisa nada diferente", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await expect(recuperarSenha("ninguem")).resolves.toBeUndefined();
  expect(resetPasswordForEmail).not.toHaveBeenCalled();
});

it("recuperar senha envia o link para o e-mail cadastrado", async () => {
  rpc.mockResolvedValue({ data: "joao@teste.local", error: null });
  resetPasswordForEmail.mockResolvedValue({ error: null });
  await recuperarSenha("joao");
  expect(resetPasswordForEmail).toHaveBeenCalledWith("joao@teste.local", {
    redirectTo: expect.stringContaining("?recuperar=1"),
  });
});
