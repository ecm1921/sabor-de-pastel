import { afterEach, describe, expect, it, vi } from "vitest";
import { novoId } from "./id";

const FORMATO_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("novoId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("gera um uuid v4 válido", () => {
    expect(novoId()).toMatch(FORMATO_UUID_V4);
  });

  it("gera ids diferentes a cada chamada", () => {
    expect(novoId()).not.toBe(novoId());
  });

  it("funciona sem crypto.randomUUID (site em http ou iPhone antigo)", () => {
    const original = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: original.getRandomValues.bind(original) });
    const id = novoId();
    expect(id).toMatch(FORMATO_UUID_V4);
    expect(novoId()).not.toBe(id);
  });
});
