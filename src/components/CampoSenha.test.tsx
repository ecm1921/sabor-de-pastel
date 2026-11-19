import { fireEvent, render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { CampoSenha } from "./CampoSenha";

it("começa escondida e o botão mostra e esconde a senha", () => {
  render(<CampoSenha rotulo="Senha" valor="segredo" aoMudar={() => {}} autoComplete="current-password" />);
  const campo = screen.getByLabelText("Senha");
  expect(campo).toHaveAttribute("type", "password");

  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(campo).toHaveAttribute("type", "text");

  fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(campo).toHaveAttribute("type", "password");
});

it("avisa o valor digitado", () => {
  const aoMudar = vi.fn();
  render(<CampoSenha rotulo="Nova senha" valor="" aoMudar={aoMudar} autoComplete="new-password" />);
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "abc12345" } });
  expect(aoMudar).toHaveBeenCalledWith("abc12345");
});
