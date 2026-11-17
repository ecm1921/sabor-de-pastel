import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import type { Produto } from "../../domain/tipos";

const listarProdutos = vi.fn();
const salvarProduto = vi.fn();
const definirAtivo = vi.fn();
const excluirProduto = vi.fn();
vi.mock("../../services/produtos", () => ({
  listarProdutos: () => listarProdutos(),
  salvarProduto: (...a: unknown[]) => salvarProduto(...a),
  definirAtivo: (...a: unknown[]) => definirAtivo(...a),
  excluirProduto: (...a: unknown[]) => excluirProduto(...a),
}));

import { Cardapio } from "./Cardapio";
import { ToastProvider } from "../../components/Toast";

const carne: Produto = { id: "p1", nome: "Pastel de Carne", categoria: "Pastéis", preco: null, preco_m: 15, preco_g: 25, ativo: true };

async function montar() {
  render(
    <ToastProvider>
      <Cardapio />
    </ToastProvider>,
  );
  await screen.findByText("Pastel de Carne");
}

beforeEach(() => {
  listarProdutos.mockReset().mockResolvedValue([carne]);
  salvarProduto.mockReset().mockImplementation(async (p) => ({ id: "novo", ...p }));
  definirAtivo.mockReset().mockResolvedValue(undefined);
  excluirProduto.mockReset();
});

it("Pastel mostra campos M e G; Bebida mostra um preço", async () => {
  await montar();
  fireEvent.click(screen.getByRole("button", { name: "Novo item" }));
  const d = screen.getByRole("dialog");
  expect(within(d).getByLabelText("Preço M (R$)")).toBeInTheDocument();
  expect(within(d).getByLabelText("Preço G (R$)")).toBeInTheDocument();
  fireEvent.change(within(d).getByLabelText("Categoria"), { target: { value: "Bebidas" } });
  expect(within(d).getByLabelText("Preço (R$)")).toBeInTheDocument();
  expect(within(d).queryByLabelText("Preço M (R$)")).not.toBeInTheDocument();
});

it("aceita preço com vírgula", async () => {
  await montar();
  fireEvent.click(screen.getByRole("button", { name: "Novo item" }));
  const d = screen.getByRole("dialog");
  fireEvent.change(within(d).getByLabelText("Nome"), { target: { value: "Suco de Laranja" } });
  fireEvent.change(within(d).getByLabelText("Categoria"), { target: { value: "Bebidas" } });
  fireEvent.change(within(d).getByLabelText("Preço (R$)"), { target: { value: "12,50" } });
  fireEvent.click(within(d).getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(salvarProduto).toHaveBeenCalledWith({
      nome: "Suco de Laranja",
      categoria: "Bebidas",
      preco: 12.5,
      preco_m: null,
      preco_g: null,
      ativo: true,
    }),
  );
});

it("não salva sem nome ou com preço inválido", async () => {
  await montar();
  fireEvent.click(screen.getByRole("button", { name: "Novo item" }));
  const d = screen.getByRole("dialog");
  fireEvent.change(within(d).getByLabelText("Preço M (R$)"), { target: { value: "abc" } });
  fireEvent.click(within(d).getByRole("button", { name: "Salvar" }));
  expect(await within(d).findByText("Digite o nome do item.")).toBeInTheDocument();
  expect(within(d).getByText("Digite um preço, por exemplo 15,00.")).toBeInTheDocument();
  expect(salvarProduto).not.toHaveBeenCalled();
});

it("excluir produto já vendido avisa que foi desativado", async () => {
  excluirProduto.mockResolvedValue("desativado");
  await montar();
  fireEvent.click(screen.getByRole("button", { name: "Editar Pastel de Carne" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir item" }));
  await waitFor(() => expect(excluirProduto).toHaveBeenCalledWith("p1"));
  expect(await screen.findByText("Item desativado porque já tem vendas")).toBeInTheDocument();
});

it("marcar como esgotado", async () => {
  await montar();
  fireEvent.click(screen.getByRole("switch", { name: "Pastel de Carne disponível" }));
  await waitFor(() => expect(definirAtivo).toHaveBeenCalledWith("p1", false));
});
