import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
vi.mock("./supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { criarPedido, paraPedido, alterarStatus } from "./pedidos";

beforeEach(() => rpc.mockReset());

describe("criarPedido", () => {
  it("criarPedido envia itens no formato do banco", async () => {
    rpc.mockResolvedValue({ data: [{ id: "abc", numero: 7 }], error: null });
    const r = await criarPedido({
      tipo: "Entrega",
      pagamento: "Pix",
      cliente: "Ana",
      observacao: "",
      telefone: "31975423850",
      endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
      itens: [{ produtoId: "p1", tamanho: "M", quantidade: 2 }],
    });
    expect(r).toEqual({ id: "abc", numero: 7 });
    expect(rpc).toHaveBeenCalledWith("criar_pedido", {
      p_tipo: "Entrega",
      p_pagamento: "Pix",
      p_cliente: "Ana",
      p_observacao: "",
      p_telefone: "31975423850",
      p_endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
      p_itens: [{ produto_id: "p1", tamanho: "M", quantidade: 2 }],
    });
  });

  it("erro do banco vira exceção", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "ITENS_VAZIOS" } });
    await expect(
      criarPedido({ tipo: "Retirada", pagamento: "Pix", cliente: "", observacao: "", telefone: "31975423850", endereco: null, itens: [] }),
    ).rejects.toMatchObject({ message: "ITENS_VAZIOS" });
  });
});

it("alterarStatus chama a função do banco", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await alterarStatus("abc", "preparando");
  expect(rpc).toHaveBeenCalledWith("alterar_status", { p_pedido: "abc", p_novo: "preparando" });
});

describe("paraPedido", () => {
  it("converte a linha do banco para o formato do app", () => {
    const p = paraPedido({
      id: "abc",
      numero: 3,
      dia: "2026-11-14",
      criado_em: "2026-11-14T21:05:00Z",
      cliente: "Ana",
      telefone: "31975423850",
      tipo: "Entrega",
      pagamento: "Pix",
      observacao: "",
      status: "recebido",
      total: "40.00",
      endereco_rua: "Rua A",
      endereco_numero: "1",
      endereco_bairro: "Centro",
      endereco_complemento: "",
      endereco_referencia: "",
      itens_pedido: [{ nome_snapshot: "Pastel de Carne", tamanho: "M", quantidade: 2, preco_unitario: "15.00" }],
    });
    expect(p.hora).toBe("18:05");
    expect(p.total).toBe(40);
    expect(p.endereco).toEqual({ rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" });
    expect(p.itens).toEqual([{ nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 }]);
  });

  it("retirada não tem endereço e aceita o formato de obter_pedido_cliente", () => {
    const p = paraPedido({
      id: "abc",
      numero: 4,
      criado_em: "2026-11-14T13:00:00Z",
      cliente: "",
      telefone: "31975423850",
      tipo: "Retirada",
      pagamento: "Dinheiro",
      observacao: "",
      status: "pronto",
      total: 10,
      endereco: null,
      itens: [{ nome: "Caldo de Cana", tamanho: null, quantidade: 1, preco_unitario: 10 }],
    });
    expect(p.dia).toBe("2026-11-14");
    expect(p.endereco).toBeNull();
    expect(p.itens[0]).toEqual({ nome: "Caldo de Cana", tamanho: null, quantidade: 1, precoUnitario: 10 });
  });
});
