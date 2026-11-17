# Sabor de Pastel

Sistema de pedidos para uma pastelaria de bairro. O cliente pede pelo celular, a equipe atende em qualquer aparelho e tudo se atualiza em tempo real.

**App:** https://ecm1921.github.io/sabor-de-pastel/
**Versão anterior (só no navegador, para comparação):** https://ecm1921.github.io/sabor-de-pastel/legado/

## O problema

A primeira versão do app guardava tudo no navegador de cada aparelho. No teste na pastelaria, isso causou três problemas:

- o pedido feito em um aparelho não aparecia no outro;
- o cliente via a mesma tela do atendente;
- não havia como saber qual balconista fez cada alteração.

## O que o app faz

**Cliente (sem login)**
- Vê o cardápio com os itens disponíveis (pastéis em tamanho M ou G).
- Escolhe Retirada ou Entrega. Na entrega, informa o endereço.
- Envia o pedido e acompanha o andamento em tempo real: Recebido → Preparando → Pronto (ou "Saiu para entrega") → Entregue.
- Pode mandar o pedido completo para o WhatsApp da pastelaria com um toque.
- O celular lembra o telefone e o endereço para o próximo pedido.

**Equipe (usuário e senha)**
- Fila de pedidos do dia com aviso sonoro quando chega pedido novo.
- Aceitar, marcar como pronto ou saiu para entrega, entregar e cancelar (com confirmação).
- "Avisar no WhatsApp": abre a mensagem pronta para o cliente.
- Impressão de comanda em impressora térmica de 80 mm.
- Registro de pedidos feitos no balcão.
- Resumo do dia: total, ticket médio, vendas por forma de pagamento, mais vendidos e exportação em CSV.

**Admin**
- Tudo da equipe, mais o cardápio (criar, editar preços, marcar esgotado, excluir) e o **log de ações**, que mostra quem fez o quê e quando, com filtro por pessoa e por dia.

## Tecnologias

- **React 18 + TypeScript + Vite**, publicado no **GitHub Pages** por GitHub Actions.
- **Supabase**: PostgreSQL, autenticação e atualização em tempo real.
- **Vitest + Testing Library** para os testes da interface e das regras.
- **PGlite** (PostgreSQL rodando dentro do Node) para testar o SQL sem depender de servidor.

## Como a segurança funciona

O app usa só a chave pública do Supabase. Quem decide o que cada pessoa pode fazer é o **banco de dados**, com Row Level Security (RLS) e funções SQL. Assim, mesmo quem tentar acessar a API direto não passa das regras.

| Quem | Cardápio | Pedidos | Log |
|---|---|---|---|
| Cliente (sem login) | vê só itens disponíveis | cria pedido; vê só o próprio, pelo código aleatório do pedido | não vê |
| Balconista | vê tudo | vê e muda o status | não vê |
| Admin | vê e altera | vê, muda o status e cancela | vê |

Regras que ficam no banco, e não na tela:

- **Preço e total** são calculados pelo banco no momento do pedido. O valor enviado pelo aparelho é ignorado.
- **Número do pedido** recomeça todo dia e nunca se repete, mesmo com dois pedidos ao mesmo tempo.
- **Status** só avança nas transições permitidas. Não dá para voltar nem "pular" etapas.
- **Log** é gravado por triggers, então nenhuma alteração passa sem registro.
- **Login por usuário**: um usuário inexistente recebe a mesma resposta de senha errada, para não revelar quem tem conta.

## Testes

```bash
npm test          # interface e regras (Vitest)
npm run test:db   # SQL: tabelas, funções, permissões e log (PGlite)
```

Os testes SQL de `supabase/tests` também rodam no SQL Editor do Supabase. Cada arquivo roda dentro de uma transação desfeita no fim, então não deixa nada gravado.

## Rodar no computador

1. Instale o Node.js 20 ou mais novo.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto Supabase.
4. `npm run dev`

Para criar o banco e as contas, siga [docs/configurar-supabase.md](docs/configurar-supabase.md).

## Organização do código

```
src/domain/       regras puras e testadas (preço, total, status, WhatsApp, resumo, log)
src/services/     acesso ao Supabase e tradução de erros para mensagens em português
src/auth/         login, sessão e proteção de rotas por papel
src/features/     telas do cliente, da equipe e do admin
src/components/   botões, chips, modal, aviso, quantidade, status
supabase/         migrations, cardápio inicial e testes SQL
```

## Contexto

Projeto de Extensão III do curso de Ciência da Computação, no Programa de Inovação e Empreendedorismo. A solução foi feita para uma pastelaria real e testada no dia a dia do negócio.

**Objetivo de Desenvolvimento Sustentável da ONU:** meta **8.3**, que trata de apoiar micro e pequenas empresas, o empreendedorismo e a inovação.

Autor: Eduardo Coelho de Moreira.
