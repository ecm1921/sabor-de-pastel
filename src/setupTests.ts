import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpa a tela entre testes (sem "globals" do Vitest, a Testing Library não faz isso sozinha).
afterEach(cleanup);
