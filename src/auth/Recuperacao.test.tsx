import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { it, expect, vi, beforeEach } from "vitest";

const confirmarLinkRecuperacao = vi.fn();
vi.mock("../services/auth", () => ({ confirmarLinkRecuperacao: (...a: unknown[]) => confirmarLinkRecuperacao(...a) }));
vi.mock("../services/supabase", () => ({
  supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } },
}));

import { Recuperacao } from "./Recuperacao";

function Login() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  return <p>Tela de login {aviso}</p>;
}

function montar() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Recuperacao />
      <Routes>
        <Route path="/" element={<p>Cardápio</p>} />
        <Route path="/atendente/nova-senha" element={<p>Tela de nova senha</p>} />
        <Route path="/atendente/login" element={<Login />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  confirmarLinkRecuperacao.mockReset();
  window.history.replaceState(null, "", "/sabor-de-pastel/?token_hash=abc&type=recovery");
});

it("link válido abre a tela de nova senha e limpa o código do endereço", async () => {
  confirmarLinkRecuperacao.mockResolvedValue("ok");
  montar();
  expect(await screen.findByText("Tela de nova senha")).toBeInTheDocument();
  expect(confirmarLinkRecuperacao).toHaveBeenCalledWith("?token_hash=abc&type=recovery");
  expect(window.location.search).toBe("");
});

it("link vencido manda para o login com explicação", async () => {
  confirmarLinkRecuperacao.mockResolvedValue("invalido");
  montar();
  expect(await screen.findByText(/O link para trocar a senha venceu ou já foi usado/)).toBeInTheDocument();
});

it("sem link de recuperação, fica onde está", async () => {
  window.history.replaceState(null, "", "/sabor-de-pastel/");
  confirmarLinkRecuperacao.mockResolvedValue(null);
  montar();
  expect(await screen.findByText("Cardápio")).toBeInTheDocument();
});
