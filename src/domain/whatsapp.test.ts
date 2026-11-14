import { describe, it, expect } from "vitest";
import { normalizarTelefone, linkWhatsApp, mensagemPedidoParaLoja, mensagemStatusParaCliente } from "./whatsapp";

it("normaliza telefone em vários formatos", () => {
  expect(normalizarTelefone("(11) 98765-4321")).toBe("11987654321");
  expect(normalizarTelefone("+55 11 98765 4321")).toBe("11987654321");
  expect(normalizarTelefone("11987654321")).toBe("11987654321");
  expect(normalizarTelefone("1133334444")).toBe("1133334444");
  expect(normalizarTelefone("98765-4321")).toBeNull();
});

it("link do whatsapp codifica o texto", () => {
  expect(linkWhatsApp("5511987654321", "Pedido nº 12\nTotal: R$ 40,00")).toBe(
    "https://wa.me/5511987654321?text=Pedido%20n%C2%BA%2012%0ATotal%3A%20R%24%2040%2C00",
  );
});

describe("mensagem para a loja tem tudo", () => {
  const base = {
    numero: 12,
    cliente: "Ana",
    telefone: "31975423850",
    itens: [{ nome: "Pastel de Carne", tamanho: "M" as const, quantidade: 2, precoUnitario: 15 }],
    total: 30,
    pagamento: "Pix" as const,
    observacao: "sem cebola",
  };
  it("em Entrega inclui o endereço", () => {
    const m = mensagemPedidoParaLoja({
      ...base,
      tipo: "Entrega",
      endereco: { rua: "Rua das Flores", numero: "120", bairro: "Centro", complemento: "apto 3", referencia: "" },
    });
    for (const parte of ["Pedido nº 12", "2x Pastel de Carne (M)", "R$", "30,00", "Pix", "31975423850", "Rua das Flores", "120", "Centro", "sem cebola", "Entrega"]) {
      expect(m).toContain(parte);
    }
  });
  it("em Retirada não tem endereço", () => {
    const m = mensagemPedidoParaLoja({ ...base, tipo: "Retirada", endereco: null });
    expect(m).toContain("Retirada");
    expect(m).not.toContain("Endereço");
  });
});

it("mensagem para o cliente depende do tipo", () => {
  expect(mensagemStatusParaCliente("Retirada")).toBe("Seu pedido está pronto para retirada");
  expect(mensagemStatusParaCliente("Entrega")).toBe("Seu pedido saiu para entrega");
});
