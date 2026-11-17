import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect, vi, beforeEach } from "vitest";

const recuperarSenha = vi.fn();
vi.mock("../services/supabase", () => ({ supabase: {} }));
vi.mock("../services/auth", () => ({ recuperarSenha: (...a: unknown[]) => recuperarSenha(...a) }));

import { ContextoAuth } from "./AuthProvider";
import { LoginPage } from "./LoginPage";

const entrar = vi.fn();

function montar() {
  render(
    <ContextoAuth.Provider value={{ perfil: null, carregando: false, entrar, sair: vi.fn() }}>
      <MemoryRouter initialEntries={["/atendente/login"]}>
        <Routes>
          <Route path="/atendente/login" element={<LoginPage />} />
          <Route path="/atendente" element={<p>Área da equipe</p>} />
        </Routes>
      </MemoryRouter>
    </ContextoAuth.Provider>,
  );
}

beforeEach(() => {
  entrar.mockReset();
  recuperarSenha.mockReset();
});

it("entra com usuário e senha e vai para a área da equipe", async () => {
  entrar.mockResolvedValue({ id: "2", usuario: "joao", nome: "João", papel: "balconista" });
  montar();
  fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "joao" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "segredo" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(screen.getByText("Área da equipe")).toBeInTheDocument());
  expect(entrar).toHaveBeenCalledWith("joao", "segredo");
});

it("senha errada mostra a mensagem e continua no login", async () => {
  entrar.mockRejectedValue({ message: "Invalid login credentials" });
  montar();
  fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "joao" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "x" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByText("Usuário ou senha incorretos.")).toBeInTheDocument();
});

it("esqueci minha senha pede o usuário e mostra a mesma resposta sempre", async () => {
  recuperarSenha.mockResolvedValue(undefined);
  montar();
  fireEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
  fireEvent.change(screen.getByLabelText("Usuário"), { target: { value: "joao" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));
  expect(await screen.findByText("Se o usuário existir, enviamos um link para o e-mail cadastrado.")).toBeInTheDocument();
  expect(recuperarSenha).toHaveBeenCalledWith("joao");
});
