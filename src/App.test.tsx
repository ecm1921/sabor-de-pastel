import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import App from "./App";

it("renderiza o nome da pastelaria", () => {
  render(<App />);
  expect(screen.getByText(/Sabor de Pastel/)).toBeInTheDocument();
});
