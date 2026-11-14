import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { StatusBadge } from "./StatusBadge";

it('StatusBadge mostra "Saiu para entrega" para pronto em Entrega', () => {
  render(<StatusBadge status="pronto" tipo="Entrega" />);
  expect(screen.getByText("Saiu para entrega")).toBeInTheDocument();
});

it('StatusBadge mostra "Pronto" para pronto em Retirada', () => {
  render(<StatusBadge status="pronto" tipo="Retirada" />);
  expect(screen.getByText("Pronto")).toBeInTheDocument();
});

it("StatusBadge marca a cor pelo status", () => {
  render(<StatusBadge status="cancelado" tipo="Retirada" />);
  expect(screen.getByText("Cancelado")).toHaveAttribute("data-status", "cancelado");
});
