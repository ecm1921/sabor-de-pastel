import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { AndamentoPedido } from "./AndamentoPedido";

it("mostra a etapa atual em destaque e marca as anteriores como feitas", () => {
  render(<AndamentoPedido status="preparando" tipo="Retirada" />);
  expect(screen.getByRole("heading", { name: "Preparando seu pedido" })).toBeInTheDocument();
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Preparando");
  const etapas = screen.getAllByRole("listitem");
  expect(etapas.map((e) => e.textContent)).toEqual(["Recebido", "Preparando", "Pronto", "Entregue"]);
  expect(etapas[0]).toHaveAttribute("data-feito");
  expect(etapas[2]).not.toHaveAttribute("data-feito");
});

it("na entrega, a etapa pronto vira saiu para entrega", () => {
  render(<AndamentoPedido status="pronto" tipo="Entrega" />);
  expect(screen.getByRole("heading", { name: "Saiu para entrega" })).toBeInTheDocument();
  expect(screen.getByText("Seu pedido está a caminho.")).toBeInTheDocument();
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Saiu para entrega");
});

it("pedido entregue fica com todas as etapas feitas", () => {
  render(<AndamentoPedido status="entregue" tipo="Retirada" />);
  expect(screen.getByRole("heading", { name: "Pedido entregue" })).toBeInTheDocument();
  const etapas = screen.getAllByRole("listitem");
  expect(etapas.slice(0, 3).every((e) => e.hasAttribute("data-feito"))).toBe(true);
});
