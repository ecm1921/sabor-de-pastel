import { it, expect } from "vitest";
import type { LogAcao } from "./tipos";
import { descreverAcao } from "./log";

const log = (p: Partial<LogAcao>): LogAcao => ({
  id: 1,
  quando: "2026-11-14T21:05:00Z",
  perfilId: "u1",
  perfilUsuario: "joao",
  perfilNome: "João",
  acao: "status_alterado",
  entidade: "pedidos",
  entidadeId: "x",
  detalhes: { antes: null, depois: null },
  ...p,
});

it("preço alterado mostra o valor antes e depois", () => {
  const l = log({
    acao: "preco_alterado",
    entidade: "produtos",
    detalhes: {
      antes: { nome: "Pastel de Carne", categoria: "Pastéis", preco_m: 15, preco_g: 25 },
      depois: { nome: "Pastel de Carne", categoria: "Pastéis", preco_m: 16, preco_g: 25 },
    },
  });
  expect(descreverAcao(l)).toMatch(/^joao alterou o preço de Pastel de Carne: M R\$\s15,00 → R\$\s16,00$/);
});

it("mudança de status usa os rótulos do tipo do pedido", () => {
  const l = log({
    detalhes: { antes: { numero: 7, tipo: "Entrega", status: "preparando" }, depois: { numero: 7, tipo: "Entrega", status: "pronto" } },
  });
  expect(descreverAcao(l)).toBe("joao mudou o pedido nº 7 de Preparando para Saiu para entrega");
});

it("pedido feito pelo cliente aparece como Cliente", () => {
  const l = log({ acao: "pedido_criado", perfilId: null, perfilUsuario: null, detalhes: { antes: null, depois: { numero: 3 } } });
  expect(descreverAcao(l)).toBe("Cliente fez o pedido nº 3");
});

it("outras ações", () => {
  expect(descreverAcao(log({ acao: "pedido_cancelado", detalhes: { antes: { numero: 4 }, depois: { numero: 4 } } }))).toBe(
    "joao cancelou o pedido nº 4",
  );
  expect(descreverAcao(log({ acao: "produto_criado", detalhes: { antes: null, depois: { nome: "Pastel Doce" } } }))).toBe(
    "joao criou o item Pastel Doce",
  );
  expect(descreverAcao(log({ acao: "produto_excluido", detalhes: { antes: { nome: "Suco" }, depois: null } }))).toBe(
    "joao excluiu o item Suco",
  );
  expect(
    descreverAcao(log({ acao: "produto_editado", detalhes: { antes: { nome: "Suco", ativo: true }, depois: { nome: "Suco", ativo: false } } })),
  ).toBe("joao marcou Suco como esgotado");
  expect(
    descreverAcao(log({ acao: "produto_editado", detalhes: { antes: { nome: "Suco", ativo: true }, depois: { nome: "Suco Natural", ativo: true } } })),
  ).toBe("joao renomeou Suco para Suco Natural");
});
