import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import type { Pedido } from "../../domain/tipos";

const listarPedidosDoDia = vi.fn();
const alterarStatus = vi.fn();
let avisarMudanca: () => void = () => {};
vi.mock("../../services/pedidos", () => ({
  listarPedidosDoDia: (...a: unknown[]) => listarPedidosDoDia(...a),
  alterarStatus: (...a: unknown[]) => alterarStatus(...a),
  assinarPedidosDoDia: (_dia: string, f: () => void) => {
    avisarMudanca = f;
    return () => {};
  },
}));
const tocarAviso = vi.fn();
vi.mock("./som", () => ({ tocarAviso: () => tocarAviso() }));

import { Pedidos } from "./Pedidos";
import { ToastProvider } from "../../components/Toast";

const pedido = (p: Partial<Pedido>): Pedido => ({
  id: "id-" + (p.numero ?? 1),
  numero: 1,
  dia: "2026-11-14",
  hora: "18:05",
  cliente: "Ana",
  telefone: "31975423850",
  tipo: "Retirada",
  pagamento: "Pix",
  observacao: "",
  status: "recebido",
  total: 30,
  endereco: null,
  itens: [{ nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 }],
  ...p,
});

const cartao = (numero: number) => screen.getByRole("article", { name: `Pedido nº ${numero}` });

function montar(lista: Pedido[]) {
  listarPedidosDoDia.mockResolvedValue(lista);
  render(
    <ToastProvider>
      <Pedidos />
    </ToastProvider>,
  );
}

beforeEach(() => {
  listarPedidosDoDia.mockReset();
  alterarStatus.mockReset().mockResolvedValue(undefined);
  tocarAviso.mockReset();
});

it('pedido recebido mostra o botão "Aceitar", que muda para preparando', async () => {
  montar([pedido({ numero: 1 })]);
  fireEvent.click(await within(await screen.findByRole("article")).findByRole("button", { name: "Aceitar" }));
  await waitFor(() => expect(alterarStatus).toHaveBeenCalledWith("id-1", "preparando"));
});

it('pedido preparando de Entrega mostra "Saiu para entrega", e o de Retirada mostra "Pronto"', async () => {
  montar([
    pedido({
      numero: 1,
      status: "preparando",
      tipo: "Entrega",
      endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
    }),
    pedido({ numero: 2, status: "preparando", tipo: "Retirada" }),
  ]);
  await screen.findAllByRole("article");
  fireEvent.click(within(cartao(1)).getByRole("button", { name: "Saiu para entrega" }));
  expect(within(cartao(2)).getByRole("button", { name: "Pronto" })).toBeInTheDocument();
  await waitFor(() => expect(alterarStatus).toHaveBeenCalledWith("id-1", "pronto"));
});

it('pedido pronto mostra "Entregue"', async () => {
  montar([pedido({ numero: 3, status: "pronto" })]);
  fireEvent.click(await within(await screen.findByRole("article")).findByRole("button", { name: "Entregue" }));
  await waitFor(() => expect(alterarStatus).toHaveBeenCalledWith("id-3", "entregue"));
});

it("cancelar pede confirmação antes de chamar alterarStatus(id, cancelado)", async () => {
  montar([pedido({ numero: 4 })]);
  fireEvent.click(await within(await screen.findByRole("article")).findByRole("button", { name: "Cancelar" }));
  expect(alterarStatus).not.toHaveBeenCalled();
  const dialogo = screen.getByRole("dialog");
  fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar pedido" }));
  await waitFor(() => expect(alterarStatus).toHaveBeenCalledWith("id-4", "cancelado"));
});

it("pedido novo vindo do tempo real toca aviso e fica destacado", async () => {
  montar([pedido({ numero: 1 })]);
  await screen.findByRole("article");
  expect(tocarAviso).not.toHaveBeenCalled();
  listarPedidosDoDia.mockResolvedValue([pedido({ numero: 2 }), pedido({ numero: 1 })]);
  await act(async () => avisarMudanca());
  await waitFor(() => expect(cartao(2)).toHaveAttribute("data-novo", "true"));
  expect(cartao(1)).not.toHaveAttribute("data-novo", "true");
  expect(tocarAviso).toHaveBeenCalledTimes(1);
});

it('pedido pronto mostra "Avisar no WhatsApp"; outros status não', async () => {
  montar([
    pedido({
      numero: 1,
      status: "pronto",
      tipo: "Entrega",
      endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
    }),
    pedido({ numero: 2, status: "preparando" }),
  ]);
  await screen.findAllByRole("article");
  const link = within(cartao(1)).getByRole("link", { name: "Avisar no WhatsApp" });
  expect(link).toHaveAttribute("href", "https://wa.me/5531975423850?text=Seu%20pedido%20saiu%20para%20entrega");
  expect(link).toHaveAttribute("target", "_blank");
  expect(within(cartao(2)).queryByRole("link", { name: "Avisar no WhatsApp" })).not.toBeInTheDocument();
});

it("card de Entrega mostra telefone e endereço completo", async () => {
  montar([
    pedido({
      numero: 5,
      tipo: "Entrega",
      endereco: { rua: "Rua das Flores", numero: "120", bairro: "Centro", complemento: "apto 3", referencia: "perto da praça" },
    }),
  ]);
  const c = await screen.findByRole("article");
  expect(c).toHaveTextContent("(31) 97542-3850");
  expect(c).toHaveTextContent("Rua das Flores, 120 - apto 3 - Centro");
  expect(c).toHaveTextContent("perto da praça");
});

it("filtro Novos mostra só os recebidos", async () => {
  montar([pedido({ numero: 1 }), pedido({ numero: 2, status: "entregue" })]);
  await screen.findAllByRole("article");
  fireEvent.click(screen.getByRole("button", { name: /Novos/ }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /Concluídos/ }));
  expect(screen.getByRole("article", { name: "Pedido nº 2" })).toBeInTheDocument();
});

it('"Imprimir" mostra a comanda e abre a impressão', async () => {
  const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
  montar([pedido({ numero: 6 })]);
  fireEvent.click(await within(await screen.findByRole("article")).findByRole("button", { name: "Imprimir" }));
  await waitFor(() => expect(imprimir).toHaveBeenCalled());
  expect(document.querySelector(".comanda")).toHaveTextContent("Pedido nº 6");
});
