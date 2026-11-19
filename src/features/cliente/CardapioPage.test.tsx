import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { it, expect, vi, beforeEach } from "vitest";
import type { Produto } from "../../domain/tipos";

const listarCardapio = vi.fn();
const criarPedido = vi.fn();
vi.mock("../../services/produtos", () => ({ listarCardapio: () => listarCardapio() }));
vi.mock("../../services/pedidos", () => ({ criarPedido: (...a: unknown[]) => criarPedido(...a) }));

import { CardapioPage } from "./CardapioPage";
import { ToastProvider } from "../../components/Toast";

const produtos: Produto[] = [
  { id: "p1", nome: "Pastel de Carne", categoria: "Pastéis", preco: null, preco_m: 15, preco_g: 25, ativo: true },
  { id: "b1", nome: "Caldo de Cana", categoria: "Bebidas", preco: 10, preco_m: null, preco_g: null, ativo: true },
];

function TelaPedido() {
  return <p>Acompanhando {useParams().id}</p>;
}

async function montar() {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<CardapioPage />} />
          <Route path="/pedido/:id" element={<TelaPedido />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
  await screen.findByText("Pastel de Carne");
}

const escolherPastelM = () => fireEvent.click(screen.getByRole("button", { name: "Aumentar Pastel de Carne M" }));
const digitar = (rotulo: string, valor: string) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const enviar = () => fireEvent.click(screen.getByRole("button", { name: "Enviar pedido" }));

beforeEach(() => {
  listarCardapio.mockReset().mockResolvedValue(produtos);
  criarPedido.mockReset();
  localStorage.clear();
});

it("mostra o total do carrinho", async () => {
  await montar();
  escolherPastelM();
  escolherPastelM();
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Caldo de Cana" }));
  expect(screen.getByText("3 itens")).toBeInTheDocument();
  expect(document.querySelector(".barra__total b")).toHaveTextContent("40,00");
});

it("envia uma vez mesmo com dois cliques", async () => {
  criarPedido.mockReturnValue(new Promise(() => {}));
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "31975423850");
  enviar();
  enviar();
  await waitFor(() => expect(criarPedido).toHaveBeenCalledTimes(1));
});

it("campo armadilha preenchido não envia, mas mostra sucesso", async () => {
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "31975423850");
  fireEvent.change(document.querySelector('input[name="site"]')!, { target: { value: "http://spam" } });
  enviar();
  expect(await screen.findByText("Pedido enviado!")).toBeInTheDocument();
  expect(criarPedido).not.toHaveBeenCalled();
});

it("se a internet cai, tentar de novo reenvia o mesmo pedido (não duplica)", async () => {
  criarPedido.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce({ id: "abc-123", numero: 7 });
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "31975423850");
  enviar();
  expect(await screen.findByRole("alert")).toHaveTextContent("Sem conexão. Tente de novo.");
  enviar();
  expect(await screen.findByText("Acompanhando abc-123")).toBeInTheDocument();
  const [primeira, segunda] = criarPedido.mock.calls.map((c) => c[0].id);
  expect(primeira).toMatch(/^[0-9a-f-]{36}$/);
  expect(segunda).toBe(primeira);
});

it("se o cliente muda o carrinho depois de uma falha, vira um pedido novo", async () => {
  criarPedido.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockReturnValueOnce(new Promise(() => {}));
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "31975423850");
  enviar();
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Caldo de Cana" }));
  enviar();
  await waitFor(() => expect(criarPedido).toHaveBeenCalledTimes(2));
  expect(criarPedido.mock.calls[1][0].id).not.toBe(criarPedido.mock.calls[0][0].id);
});

it("erro de item esgotado mantém o carrinho e mostra a mensagem", async () => {
  criarPedido.mockRejectedValue({ message: "ITEM_INDISPONIVEL:Pastel de Carne" });
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "31975423850");
  enviar();
  expect(await screen.findByRole("alert")).toHaveTextContent("Pastel de Carne acabou. Tire do carrinho e tente de novo.");
  expect(screen.getByText("1 item")).toBeInTheDocument();
});

it("após enviar, vai para /pedido/:id e guarda o id e os dados no aparelho", async () => {
  criarPedido.mockResolvedValue({ id: "abc-123", numero: 7 });
  await montar();
  escolherPastelM();
  digitar("Nome", "Ana");
  digitar("Telefone com DDD", "(31) 97542-3850");
  enviar();
  expect(await screen.findByText("Acompanhando abc-123")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("sabor.meusPedidos")!)).toEqual(["abc-123"]);
  expect(JSON.parse(localStorage.getItem("sabor.meusDados")!).telefone).toBe("(31) 97542-3850");
  expect(criarPedido.mock.calls[0][0]).toMatchObject({
    telefone: "31975423850",
    tipo: "Retirada",
    endereco: null,
    itens: [{ produtoId: "p1", tamanho: "M", quantidade: 1 }],
  });
});

it("os dados só aparecem depois de escolher um item", async () => {
  await montar();
  expect(screen.queryByLabelText("Telefone com DDD")).not.toBeInTheDocument();
  escolherPastelM();
  expect(screen.getByLabelText("Telefone com DDD")).toBeInTheDocument();
});

it("entrega mostra campos de endereço e retirada não", async () => {
  await montar();
  escolherPastelM();
  expect(screen.queryByLabelText("Rua")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Entrega" }));
  expect(screen.getByLabelText("Rua")).toBeInTheDocument();
  expect(screen.getByLabelText("Bairro")).toBeInTheDocument();
});

it("não envia sem nome, sem telefone válido ou, em Entrega, sem rua, número e bairro", async () => {
  await montar();
  escolherPastelM();
  fireEvent.click(screen.getByRole("button", { name: "Entrega" }));
  digitar("Telefone com DDD", "1234");
  enviar();
  expect(await screen.findByText("Informe o telefone com DDD.")).toBeInTheDocument();
  expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
  expect(screen.getByText("Informe a rua.")).toBeInTheDocument();
  expect(screen.getByText("Informe o número.")).toBeInTheDocument();
  expect(screen.getByText("Informe o bairro.")).toBeInTheDocument();
  expect(criarPedido).not.toHaveBeenCalled();
});

it("lembra telefone e endereço do último pedido", async () => {
  localStorage.setItem(
    "sabor.meusDados",
    JSON.stringify({ cliente: "Ana", telefone: "31975423850", tipo: "Entrega", endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" } }),
  );
  await montar();
  escolherPastelM();
  expect(screen.getByLabelText("Telefone com DDD")).toHaveValue("31975423850");
  expect(screen.getByLabelText("Rua")).toHaveValue("Rua A");
});

it("mostra o link da área da equipe no topo da página", async () => {
  await montar();
  const link = screen.getByRole("link", { name: "Área da equipe" });
  expect(link.closest("header")).not.toBeNull();
  expect(link).toHaveAttribute("href", "/atendente");
});
