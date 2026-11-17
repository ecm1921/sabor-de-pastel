import { it, expect } from "vitest";
import type { Pedido } from "./tipos";
import { resumirDia, gerarCsv } from "./resumo";

const pedido = (p: Partial<Pedido>): Pedido => ({
  id: "x",
  numero: 1,
  dia: "2026-11-14",
  hora: "18:05",
  cliente: "",
  telefone: "31975423850",
  tipo: "Retirada",
  pagamento: "Pix",
  observacao: "",
  status: "entregue",
  total: 40,
  endereco: null,
  itens: [
    { nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 },
    { nome: "Caldo de Cana", tamanho: null, quantidade: 1, precoUnitario: 10 },
  ],
  ...p,
});

it("cancelados não entram no total mas são contados", () => {
  const r = resumirDia([
    pedido({ numero: 1 }),
    pedido({ numero: 2, pagamento: "Dinheiro", total: 25, itens: [{ nome: "Pastel de Queijo", tamanho: "G", quantidade: 1, precoUnitario: 25 }] }),
    pedido({ numero: 3, status: "cancelado", total: 100 }),
  ]);
  expect(r.total).toBe(65);
  expect(r.quantidade).toBe(2);
  expect(r.cancelados).toBe(1);
  expect(r.ticketMedio).toBe(32.5);
  expect(r.pasteis).toBe(3);
  expect(r.porPagamento).toEqual({
    Pix: { quantidade: 1, valor: 40 },
    Dinheiro: { quantidade: 1, valor: 25 },
    Cartão: { quantidade: 0, valor: 0 },
  });
});

it("ticket médio é zero sem pedidos", () => {
  const r = resumirDia([]);
  expect(r.ticketMedio).toBe(0);
  expect(r.total).toBe(0);
  expect(r.maisVendidos).toEqual([]);
});

it("mais vendidos em ordem decrescente, separando tamanhos", () => {
  const r = resumirDia([
    pedido({ numero: 1 }),
    pedido({ numero: 2, itens: [{ nome: "Pastel de Carne", tamanho: "M", quantidade: 3, precoUnitario: 15 }] }),
  ]);
  expect(r.maisVendidos).toEqual([
    { nome: "Pastel de Carne (M)", quantidade: 5 },
    { nome: "Caldo de Cana", quantidade: 1 },
  ]);
});

it("csv escapa ponto e vírgula e quebra de linha", () => {
  const csv = gerarCsv([pedido({ cliente: "Ana; mesa\n2", observacao: 'diz "oi"' })]);
  const [cabecalho, ...resto] = csv.split("\r\n");
  expect(cabecalho).toBe("pedido;data;hora;cliente;tipo;pagamento;status;itens;total");
  expect(resto.join("\r\n")).toContain('"Ana; mesa\n2"');
});

it("csv usa vírgula decimal", () => {
  const linha = gerarCsv([pedido({ numero: 7 })]).split("\r\n")[1];
  expect(linha).toBe("7;14/11/2026;18:05;;Retirada;Pix;Entregue;2x Pastel de Carne (M) + 1x Caldo de Cana;40,00");
});
