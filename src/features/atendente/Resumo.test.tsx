import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import type { Pedido } from "../../domain/tipos";

const listarPedidosDoDia = vi.fn();
vi.mock("../../services/pedidos", () => ({ listarPedidosDoDia: (...a: unknown[]) => listarPedidosDoDia(...a) }));

import { Resumo } from "./Resumo";
import { ToastProvider } from "../../components/Toast";

const pedido: Pedido = {
  id: "x",
  numero: 1,
  dia: "2026-11-13",
  hora: "18:05",
  cliente: "",
  telefone: "31975423850",
  tipo: "Retirada",
  pagamento: "Pix",
  observacao: "",
  status: "entregue",
  total: 40,
  endereco: null,
  itens: [{ nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 }],
};

it("mostra os números do dia escolhido e copia as vendas", async () => {
  listarPedidosDoDia.mockResolvedValue([pedido]);
  const escrever = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText: escrever }, configurable: true });
  render(
    <ToastProvider>
      <Resumo />
    </ToastProvider>,
  );
  fireEvent.change(screen.getByLabelText("Dia"), { target: { value: "2026-11-13" } });
  await waitFor(() => expect(listarPedidosDoDia).toHaveBeenLastCalledWith("2026-11-13"));
  expect(await screen.findByText("Total vendido")).toBeInTheDocument();
  expect(screen.getByTestId("kpi-total")).toHaveTextContent("40,00");
  expect(screen.getByText("Pastel de Carne (M)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Copiar vendas do dia" }));
  await waitFor(() => expect(escrever).toHaveBeenCalledWith(expect.stringContaining("pedido;data;hora")));
});
