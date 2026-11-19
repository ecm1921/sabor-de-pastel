import { it, expect } from "vitest";
import { dadosVazios, validarDados, paraEnvio } from "./dados";

it("telefone é obrigatório e precisa de DDD", () => {
  expect(validarDados({ ...dadosVazios(), telefone: "" }).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "98765-4321" }).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "(31) 97542-3850" }).telefone).toBeUndefined();
});

it("nome é obrigatório", () => {
  expect(validarDados({ ...dadosVazios(), cliente: "" }).cliente).toBe("Informe o nome.");
  expect(validarDados({ ...dadosVazios(), cliente: "   " }).cliente).toBe("Informe o nome.");
  expect(validarDados({ ...dadosVazios(), cliente: "Ana" }).cliente).toBeUndefined();
});

it("entrega exige rua, número e bairro; retirada não", () => {
  const entrega = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", tipo: "Entrega" as const };
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

it("dinheiro pergunta se precisa de troco e para quanto", () => {
  const base = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", pagamento: "Dinheiro" as const };
  expect(validarDados(base).troco).toBe("Diga se precisa de troco.");
  expect(validarDados({ ...base, precisaTroco: false }).troco).toBeUndefined();
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "" }).trocoPara).toBe("Informe para quanto é o troco.");
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "abc" }).trocoPara).toBe("Informe para quanto é o troco.");
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "50" })).toEqual({});
  expect(validarDados({ ...base, pagamento: "Pix" }).troco).toBeUndefined();
});

it("o troco vai junto na observação do pedido", () => {
  const base = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", pagamento: "Dinheiro" as const, observacao: "sem cebola" };
  expect(paraEnvio({ ...base, precisaTroco: true, trocoPara: "50" }, []).observacao).toBe("sem cebola. Troco para R$ 50,00");
  expect(paraEnvio({ ...base, observacao: "", precisaTroco: false }, []).observacao).toBe("Sem troco");
  expect(paraEnvio({ ...base, pagamento: "Pix", precisaTroco: true, trocoPara: "50" }, []).observacao).toBe("sem cebola");
});
