import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import type { LogAcao } from "../../domain/tipos";

const listarLog = vi.fn();
const listarPerfis = vi.fn();
vi.mock("../../services/log", () => ({
  listarLog: (...a: unknown[]) => listarLog(...a),
  listarPerfis: () => listarPerfis(),
}));

import { Log } from "./Log";

const linha: LogAcao = {
  id: 1,
  quando: "2026-11-14T21:05:00Z",
  perfilId: "u2",
  perfilUsuario: "joao",
  perfilNome: "João",
  acao: "preco_alterado",
  entidade: "produtos",
  entidadeId: "p1",
  detalhes: {
    antes: { nome: "Pastel de Carne", categoria: "Pastéis", preco_m: 15, preco_g: 25 },
    depois: { nome: "Pastel de Carne", categoria: "Pastéis", preco_m: 16, preco_g: 25 },
  },
};

it("log filtra por usuário e dia e mostra quem, quando e o quê", async () => {
  listarLog.mockResolvedValue([linha]);
  listarPerfis.mockResolvedValue([
    { id: "u1", usuario: "admin", nome: "Admin" },
    { id: "u2", usuario: "joao", nome: "João" },
  ]);
  render(<Log />);
  expect(await screen.findByText(/joao alterou o preço de Pastel de Carne: M R\$\s15,00 → R\$\s16,00/)).toBeInTheDocument();
  expect(screen.getByText("18:05")).toBeInTheDocument();

  fireEvent.change(await screen.findByLabelText("Pessoa"), { target: { value: "u2" } });
  await waitFor(() => expect(listarLog).toHaveBeenLastCalledWith(expect.objectContaining({ perfilId: "u2" })));
  fireEvent.change(screen.getByLabelText("Dia"), { target: { value: "2026-11-13" } });
  await waitFor(() => expect(listarLog).toHaveBeenLastCalledWith({ dia: "2026-11-13", perfilId: "u2" }));
});
