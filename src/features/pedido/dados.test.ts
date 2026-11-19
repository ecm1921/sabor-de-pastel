import { it, expect } from "vitest";
import { calcularTroco, dadosVazios, validarDados, paraEnvio } from "./dados";

it("telefone é obrigatório e precisa de DDD", () => {
  expect(validarDados({ ...dadosVazios(), telefone: "" }, 15).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "98765-4321" }, 15).telefone).toBe("Informe o telefone com DDD.");
  expect(validarDados({ ...dadosVazios(), telefone: "(31) 97542-3850" }, 15).telefone).toBeUndefined();
});

it("nome é obrigatório", () => {
  expect(validarDados({ ...dadosVazios(), cliente: "" }, 15).cliente).toBe("Informe o nome.");
  expect(validarDados({ ...dadosVazios(), cliente: "   " }, 15).cliente).toBe("Informe o nome.");
  expect(validarDados({ ...dadosVazios(), cliente: "Ana" }, 15).cliente).toBeUndefined();
});

it("entrega exige rua, número e bairro; retirada não", () => {
  const entrega = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", tipo: "Entrega" as const };
  expect(validarDados(entrega, 15)).toEqual({
    rua: "Informe a rua.",
    numero: "Informe o número.",
    bairro: "Informe o bairro.",
  });
  expect(validarDados({ ...entrega, tipo: "Retirada" }, 15)).toEqual({});
});

it("prepara o envio: telefone só com dígitos e sem endereço na retirada", () => {
  const d = {
    ...dadosVazios(),
    cliente: "  Ana ",
    telefone: "+55 (31) 97542-3850",
    tipo: "Retirada" as const,
    endereco: { rua: "Rua A", numero: "1", bairro: "Centro", complemento: "", referencia: "" },
  };
  const envio = paraEnvio(d, [{ produtoId: "p1", tamanho: "M", quantidade: 1 }], 15);
  expect(envio.telefone).toBe("31975423850");
  expect(envio.endereco).toBeNull();
  expect(envio.cliente).toBe("Ana");
  expect(paraEnvio({ ...d, tipo: "Entrega" }, [], 15).endereco).toEqual(d.endereco);
});

it("dinheiro pergunta se precisa de troco e para quanto", () => {
  const base = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", pagamento: "Dinheiro" as const };
  expect(validarDados(base, 15).troco).toBe("Diga se precisa de troco.");
  expect(validarDados({ ...base, precisaTroco: false }, 15).troco).toBeUndefined();
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "" }, 15).trocoPara).toBe("Informe para quanto é o troco.");
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "abc" }, 15).trocoPara).toBe("Informe para quanto é o troco.");
  expect(validarDados({ ...base, precisaTroco: true, trocoPara: "50" }, 15)).toEqual({});
  expect(validarDados({ ...base, pagamento: "Pix" }, 15).troco).toBeUndefined();
});

it("o troco vai junto na observação do pedido", () => {
  const base = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", pagamento: "Dinheiro" as const, observacao: "sem cebola" };
  expect(paraEnvio({ ...base, precisaTroco: true, trocoPara: "50" }, [], 25).observacao).toBe("sem cebola. Troco para R$ 50,00 (devolver R$ 25,00)");
  expect(paraEnvio({ ...base, observacao: "", precisaTroco: false }, [], 25).observacao).toBe("Sem troco");
  expect(paraEnvio({ ...base, pagamento: "Pix", precisaTroco: true, trocoPara: "50" }, [], 25).observacao).toBe("sem cebola");
});

it("o troco precisa ser para um valor maior que o total, e o sistema calcula quanto devolver", () => {
  const base = { ...dadosVazios(), cliente: "Ana", telefone: "31975423850", pagamento: "Dinheiro" as const, precisaTroco: true };
  expect(validarDados({ ...base, trocoPara: "20" }, 25).trocoPara).toBe("O valor precisa ser maior que o total do pedido (R$ 25,00).");
  expect(validarDados({ ...base, trocoPara: "25" }, 25).trocoPara).toBe("O valor precisa ser maior que o total do pedido (R$ 25,00).");
  expect(validarDados({ ...base, trocoPara: "30" }, 25)).toEqual({});
  expect(calcularTroco({ ...base, trocoPara: "50" }, 32.5)).toBe(17.5);
  expect(calcularTroco({ ...base, trocoPara: "20" }, 25)).toBeNull();
  expect(calcularTroco({ ...base, pagamento: "Pix", trocoPara: "50" }, 25)).toBeNull();
});
