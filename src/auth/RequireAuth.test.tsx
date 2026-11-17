import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect, vi } from "vitest";
import type { Perfil } from "../domain/tipos";

vi.mock("../services/supabase", () => ({ supabase: {} }));

import { ContextoAuth } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";

const admin: Perfil = { id: "1", usuario: "admin", nome: "Admin", papel: "admin" };
const balconista: Perfil = { id: "2", usuario: "joao", nome: "João", papel: "balconista" };

function montar(perfil: Perfil | null, rota: string) {
  render(
    <ContextoAuth.Provider value={{ perfil, carregando: false, entrar: vi.fn(), sair: vi.fn() }}>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/atendente/login" element={<p>Tela de login</p>} />
          <Route
            path="/atendente"
            element={
              <RequireAuth>
                <p>Área da equipe</p>
              </RequireAuth>
            }
          />
          <Route
            path="/atendente/log"
            element={
              <RequireAuth papel="admin">
                <p>Log de ações</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </ContextoAuth.Provider>,
  );
}

it("sem sessão redireciona para o login", () => {
  montar(null, "/atendente");
  expect(screen.getByText("Tela de login")).toBeInTheDocument();
});

it("balconista entra na área da equipe", () => {
  montar(balconista, "/atendente");
  expect(screen.getByText("Área da equipe")).toBeInTheDocument();
});

it('balconista em rota de admin vê "Você não tem permissão para isso."', () => {
  montar(balconista, "/atendente/log");
  expect(screen.getByText("Você não tem permissão para isso.")).toBeInTheDocument();
  expect(screen.queryByText("Log de ações")).not.toBeInTheDocument();
});

it("admin entra na rota de admin", () => {
  montar(admin, "/atendente/log");
  expect(screen.getByText("Log de ações")).toBeInTheDocument();
});
