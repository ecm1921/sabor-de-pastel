import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { Quantidade } from "./Quantidade";

it("Quantidade não passa de 50", () => {
  const aoMudar = vi.fn();
  render(<Quantidade valor={50} aoMudar={aoMudar} rotulo="Pastel de Carne M" />);
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Pastel de Carne M" }));
  expect(aoMudar).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Aumentar Pastel de Carne M" })).toBeDisabled();
});

it("Quantidade não fica abaixo de 0", () => {
  const aoMudar = vi.fn();
  render(<Quantidade valor={0} aoMudar={aoMudar} rotulo="Caldo de Cana" />);
  fireEvent.click(screen.getByRole("button", { name: "Diminuir Caldo de Cana" }));
  expect(aoMudar).not.toHaveBeenCalled();
});

it("botões de Quantidade têm aria-label Diminuir/Aumentar e rótulo do produto", () => {
  const aoMudar = vi.fn();
  render(<Quantidade valor={2} aoMudar={aoMudar} rotulo="Caldo de Cana" />);
  fireEvent.click(screen.getByRole("button", { name: "Aumentar Caldo de Cana" }));
  expect(aoMudar).toHaveBeenLastCalledWith(3);
  fireEvent.click(screen.getByRole("button", { name: "Diminuir Caldo de Cana" }));
  expect(aoMudar).toHaveBeenLastCalledWith(1);
  expect(screen.getByText("2")).toBeInTheDocument();
});
