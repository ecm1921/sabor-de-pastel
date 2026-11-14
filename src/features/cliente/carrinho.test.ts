import { it, expect } from "vitest";
import { carrinhoReducer, itensDoCarrinho, type Carrinho } from "./carrinho";

it("carrinho: mais e menos alteram a quantidade e remove o item no zero", () => {
  let c: Carrinho = {};
  c = carrinhoReducer(c, { tipo: "mais", produtoId: "p1", tamanho: "M" });
  c = carrinhoReducer(c, { tipo: "mais", produtoId: "p1", tamanho: "M" });
  c = carrinhoReducer(c, { tipo: "mais", produtoId: "p1", tamanho: "G" });
  c = carrinhoReducer(c, { tipo: "mais", produtoId: "b1", tamanho: null });
  expect(itensDoCarrinho(c)).toEqual([
    { produtoId: "p1", tamanho: "M", quantidade: 2 },
    { produtoId: "p1", tamanho: "G", quantidade: 1 },
    { produtoId: "b1", tamanho: null, quantidade: 1 },
  ]);
  c = carrinhoReducer(c, { tipo: "menos", produtoId: "p1", tamanho: "G" });
  c = carrinhoReducer(c, { tipo: "menos", produtoId: "b1", tamanho: null });
  c = carrinhoReducer(c, { tipo: "menos", produtoId: "b1", tamanho: null });
  expect(itensDoCarrinho(c)).toEqual([{ produtoId: "p1", tamanho: "M", quantidade: 2 }]);
  expect(c["p1|M"].quantidade).toBe(2);
});

it("carrinho não passa de 50 por item", () => {
  let c: Carrinho = { "b1|": { produtoId: "b1", tamanho: null, quantidade: 50 } };
  c = carrinhoReducer(c, { tipo: "mais", produtoId: "b1", tamanho: null });
  expect(c["b1|"].quantidade).toBe(50);
});

it("limpar esvazia", () => {
  const c = carrinhoReducer({ "b1|": { produtoId: "b1", tamanho: null, quantidade: 3 } }, { tipo: "limpar" });
  expect(itensDoCarrinho(c)).toEqual([]);
});
