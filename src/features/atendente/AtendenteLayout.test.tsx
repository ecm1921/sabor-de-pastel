import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect, vi } from "vitest";
import type { Perfil } from "../../domain/tipos";

vi.mock("../../services/supabase", () => ({ supabase: {} }));
vi.mock("./Pedidos", () => ({ Pedidos: () => <p>Tela de pedidos</p> }));
vi.mock("./NovoPedido", () => ({ NovoPedido: () => <p>Tela de novo pedido</p> }));
vi.mock("./Resumo", () => ({ Resumo: () => <p>Tela de resumo</p> }));
vi.mock("./Cardapio", () => ({ Cardapio: () => <p>Tela de cardápio</p> }));
vi.mock("./Log", () => ({ Log: () => <p>Tela de log</p> }));

import { ContextoAuth } from "../../auth/AuthProvider";
import { AtendenteLayout } from "./AtendenteLayout";

function montar(perfil: Perfil, rota = "/atendente/pedidos") {
  render(
    <ContextoAuth.Provider value={{ perfil, carregando: false, entrar: vi.fn(), sair: vi.fn() }}>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/atendente/*" element={<AtendenteLayout />} />
        </Routes>
      </MemoryRouter>
    </ContextoAuth.Provider>,
  );
}

it("balconista não vê as abas Cardápio e Log", () => {
  montar({ id: "2", usuario: "joao", nome: "João", papel: "balconista" });
  const abas = screen.getAllByRole("link").map((a) => a.textContent);
  expect(abas).toEqual(["Pedidos", "Novo pedido", "Resumo"]);
});

it("balconista que digita o endereço do log não vê o log", () => {
  montar({ id: "2", usuario: "joao", nome: "João", papel: "balconista" }, "/atendente/log");
  expect(screen.getByText("Você não tem permissão para isso.")).toBeInTheDocument();
  expect(screen.queryByText("Tela de log")).not.toBeInTheDocument();
});

it("admin vê todas as abas e o log", () => {
  montar({ id: "1", usuario: "admin", nome: "Admin", papel: "admin" }, "/atendente/log");
  expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Pedidos", "Novo pedido", "Resumo", "Cardápio", "Log"]);
  expect(screen.getByText("Tela de log")).toBeInTheDocument();
});
