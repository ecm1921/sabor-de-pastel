import { it, expect } from "vitest";
import { mensagemDeErro } from "./erros";

const doBanco = (message: string) => ({ message, code: "P0001" });

it("item esgotado diz qual item", () => {
  expect(mensagemDeErro(doBanco("ITEM_INDISPONIVEL:Pastel de Carne"))).toBe(
    "Pastel de Carne acabou. Tire do carrinho e tente de novo.",
  );
});

it("mensagens fixas dos erros do banco", () => {
  expect(mensagemDeErro(doBanco("TRANSICAO_INVALIDA"))).toBe("Esse pedido já mudou de situação. Atualize a lista.");
  expect(mensagemDeErro(doBanco("SEM_PERMISSAO"))).toBe("Você não tem permissão para isso.");
  expect(mensagemDeErro(doBanco("TELEFONE_INVALIDO"))).toBe("Confira o telefone com DDD.");
  expect(mensagemDeErro(doBanco("ENDERECO_INCOMPLETO"))).toBe("Preencha rua, número e bairro para a entrega.");
  expect(mensagemDeErro(doBanco("ITENS_VAZIOS"))).toBe("Escolha pelo menos um item.");
  expect(mensagemDeErro(doBanco("QUANTIDADE_INVALIDA"))).toBe("A quantidade de cada item vai de 1 a 50.");
  expect(mensagemDeErro(doBanco("TAMANHO_INVALIDO:Pastel de Carne"))).toBe("Escolha o tamanho de Pastel de Carne.");
  expect(mensagemDeErro(doBanco("PEDIDO_NAO_ENCONTRADO"))).toBe("Pedido não encontrado.");
});

it("login inválido", () => {
  expect(mensagemDeErro({ message: "Invalid login credentials", status: 400 })).toBe("Usuário ou senha incorretos.");
});

it("sem conexão", () => {
  expect(mensagemDeErro(new TypeError("Failed to fetch"))).toBe("Sem conexão. Tente de novo.");
  expect(mensagemDeErro({ message: "TypeError: Failed to fetch" })).toBe("Sem conexão. Tente de novo.");
});

it("qualquer outro erro não mostra detalhes do banco", () => {
  expect(mensagemDeErro(doBanco('relation "pedidos" does not exist'))).toBe("Algo deu errado. Tente de novo.");
  expect(mensagemDeErro(undefined)).toBe("Algo deu errado. Tente de novo.");
});
