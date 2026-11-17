import { render } from "@testing-library/react";
import { it, expect } from "vitest";
import type { Pedido } from "../../domain/tipos";
import { Comanda } from "./Comanda";

const base: Pedido = {
  id: "x",
  numero: 12,
  dia: "2026-11-14",
  hora: "18:05",
  cliente: "Ana",
  telefone: "31975423850",
  tipo: "Entrega",
  pagamento: "Dinheiro",
  observacao: "sem cebola",
  status: "recebido",
  total: 40,
  endereco: { rua: "Rua das Flores", numero: "120", bairro: "Centro", complemento: "apto 3", referencia: "perto da praça" },
  itens: [
    { nome: "Pastel de Carne", tamanho: "M", quantidade: 2, precoUnitario: 15 },
    { nome: "Caldo de Cana", tamanho: null, quantidade: 1, precoUnitario: 10 },
  ],
};

it("Comanda mostra número, data e hora, tipo, itens com tamanho, total, pagamento, observação, telefone e endereço", () => {
  const { container } = render(<Comanda pedido={base} />);
  const texto = container.textContent ?? "";
  for (const parte of [
    "Sabor de Pastel",
    "Pedido nº 12",
    "14/11/2026",
    "18:05",
    "Entrega",
    "2x Pastel de Carne (M)",
    "1x Caldo de Cana",
    "40,00",
    "Dinheiro",
    "sem cebola",
    "(31) 97542-3850",
    "Rua das Flores, 120 - apto 3 - Centro",
    "perto da praça",
    "Ana",
  ]) {
    expect(texto).toContain(parte);
  }
});

it("Comanda de Retirada não mostra endereço", () => {
  const { container } = render(<Comanda pedido={{ ...base, tipo: "Retirada", endereco: null }} />);
  expect(container.textContent).toContain("Retirada");
  expect(container.textContent).not.toContain("Endereço");
});
