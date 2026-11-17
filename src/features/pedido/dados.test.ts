import { it, expect } from "vitest";
import { dadosVazios, validarDados, paraEnvio } from "./dados";

it("telefone é obrigatório e precisa de DDD", () => {
  expect(validarDados({ ...dadosVazios(), telefone: "" }).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "98765-4321" }).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "(31) 97542-3850" }).telefone).toBeUndefined();
});

it("entrega exige rua, número e bairro; retirada não", () => {
  const entrega = { ...dadosVazios(), telefone: "31975423850", tipo: "Entrega" as const };
  expect(validarDados(entrega)).toEqual({
    rua: "Informe a rua.",
    numero: "Informe o número.",
    bairro: "Informe o bairro.",
  });
  expect(validarDados({ ...entrega, tipo: "Retirada" })).toEqual({});
});

it("prepara o envio: telefone só com dígitos e sem endereço na retirada", () => {
  const d = {
    ...dadosVazios(),
    cliente: "  Ana ",
    telefone: "+55 (31) 97542-3850",
    tipo: "Retirada" as const,
    endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
  };
  const envio = paraEnvio(d, [{ produtoId: "p1", tamanho: "M", quantidade: 1 }]);
  expect(envio.telefone).toBe("31975423850");
  expect(envio.endereco).toBeNull();
  expect(envio.cliente).toBe("Ana");
  expect(paraEnvio({ ...d, tipo: "Entrega" }, []).endereco).toEqual(d.endereco);
});
