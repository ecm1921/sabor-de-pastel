import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect, vi, beforeEach } from "vitest";
import type { Pedido, Status } from "../../domain/tipos";
import { linkWhatsApp, mensagemPedidoParaLoja } from "../../domain/whatsapp";

const obterPedidoCliente = vi.fn();
let mudarStatus: (s: Status) => void = () => {};
vi.mock("../../services/pedidos", () => ({
  obterPedidoCliente: (...a: unknown[]) => obterPedidoCliente(...a),
  assinarStatusDoPedido: (_id: string, f: (s: Status) => void) => {
    mudarStatus = f;
    return () => {};
  },
}));

import { AcompanharPage } from "./AcompanharPage";

const pedido: Pedido = {
  id: "abc",
  numero: 7,
  dia: "2026-11-14",
  hora: "18:05",
  cliente: "Ana",
  telefone: "31975423850",
  tipo: "Entrega",
  pagamento: "Pix",
  observacao: "sem cebola",
  status: "recebido",
  total: 30,
  endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
  itens: [{ nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 }],
};

async function montar() {
  render(
    <MemoryRouter initialEntries={["/pedido/abc"]}>
      <Routes>
        <Route path="/pedido/:id" element={<AcompanharPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText("Pedido nº 7");
}

beforeEach(() => {
  obterPedidoCliente.mockReset().mockResolvedValue(pedido);
  vi.stubEnv("VITE_WHATSAPP_LOJA", "5531975423850");
});

it('tela do pedido mostra "Enviar pelo WhatsApp" com o pedido completo para a loja', async () => {
  await montar();
  const link = screen.getByRole("link", { name: "Enviar pelo WhatsApp" });
  expect(link).toHaveAttribute("href", linkWhatsApp("5531975423850", mensagemPedidoParaLoja(pedido)));
  expect(link).toHaveAttribute("target", "_blank");
});

it("o status muda sozinho quando a pastelaria aceita", async () => {
  await montar();
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Recebido");
  await act(async () => mudarStatus("preparando"));
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Preparando");
  await act(async () => mudarStatus("pronto"));
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Saiu para entrega");
});

it("pedido não encontrado avisa o cliente", async () => {
  obterPedidoCliente.mockResolvedValue(null);
  render(
    <MemoryRouter initialEntries={["/pedido/zzz"]}>
      <Routes>
        <Route path="/pedido/:id" element={<AcompanharPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Não encontramos esse pedido.")).toBeInTheDocument();
});
