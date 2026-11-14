import { describe, it, expect } from "vitest";
import type { Produto } from "./tipos";
import { precoUnitario, calcularTotal, proximosStatus, rotuloStatus, formatarBRL } from "./pedido";

const pastel: Produto = { id: "p1", nome: "Pastel de Carne", categoria: "Pastéis", preco: null, preco_m: 15, preco_g: 25, ativo: true };
const bebida: Produto = { id: "b1", nome: "Caldo de Cana", categoria: "Bebidas", preco: 10, preco_m: null, preco_g: null, ativo: true };

describe("precoUnitario", () => {
  it("pastel usa preço do tamanho", () => {
    expect(precoUnitario(pastel, "M")).toBe(15);
    expect(precoUnitario(pastel, "G")).toBe(25);
  });
  it("pastel sem tamanho lança erro", () => {
    expect(() => precoUnitario(pastel, null)).toThrow();
  });
  it("bebida com tamanho lança erro", () => {
    expect(() => precoUnitario(bebida, "M")).toThrow();
  });
  it("bebida sem tamanho usa preço único", () => {
    expect(precoUnitario(bebida, null)).toBe(10);
  });
});

it("total soma sem erro de centavos", () => {
  expect(calcularTotal([{ precoUnitario: 0.1, quantidade: 3 }])).toBe(0.3);
});

it("transições", () => {
  expect(proximosStatus("recebido")).toEqual(["preparando", "cancelado"]);
  expect(proximosStatus("preparando")).toEqual(["pronto", "cancelado"]);
  expect(proximosStatus("pronto")).toEqual(["entregue"]);
  expect(proximosStatus("entregue")).toEqual([]);
  expect(proximosStatus("cancelado")).toEqual([]);
});

it("rótulo de pronto depende do tipo", () => {
  expect(rotuloStatus("pronto", "Retirada")).toBe("Pronto");
  expect(rotuloStatus("pronto", "Entrega")).toBe("Saiu para entrega");
  expect(rotuloStatus("recebido", "Entrega")).toBe("Recebido");
  expect(rotuloStatus("preparando", "Retirada")).toBe("Preparando");
  expect(rotuloStatus("entregue", "Retirada")).toBe("Entregue");
  expect(rotuloStatus("cancelado", "Entrega")).toBe("Cancelado");
});

it("formata reais", () => {
  expect(formatarBRL(15)).toMatch(/R\$\s15,00/);
});
