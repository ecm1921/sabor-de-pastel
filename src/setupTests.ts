import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpa a tela entre testes (sem "globals" do Vitest, a Testing Library não faz isso sozinha).
afterEach(cleanup);

// Node recente tem um localStorage próprio que esconde o do jsdom; nos testes usamos um em memória.
if (typeof globalThis.localStorage?.clear !== "function") {
  const dados = new Map<string, string>();
  const memoria: Storage = {
    get length() {
      return dados.size;
    },
    clear: () => dados.clear(),
    getItem: (k) => dados.get(k) ?? null,
    key: (i) => [...dados.keys()][i] ?? null,
    removeItem: (k) => void dados.delete(k),
    setItem: (k, v) => void dados.set(k, String(v)),
  };
  Object.defineProperty(globalThis, "localStorage", { value: memoria, configurable: true });
  Object.defineProperty(window, "localStorage", { value: memoria, configurable: true });
}
