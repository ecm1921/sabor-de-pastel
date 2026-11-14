# Sabor de Pastel: versão 2 (design)

Data: 2026-11-14
Prazo: 28/11/2026 (entrega do Projeto de Extensão III)
Tipo: arquitetural (novo banco de dados, duas áreas de acesso, login)

## 1. Objetivo

Transformar o app atual (que guarda tudo no navegador de cada aparelho) em um sistema compartilhado, em que:

- o cliente faz o pedido pelo celular, sem login;
- os balconistas registram e acompanham pedidos em qualquer aparelho, em horários diferentes;
- o admin vê o log de quem fez cada ação;
- o visual é bonito e funciona bem no celular.

Motivação: a pastelaria real (da namorada do autor) vai usar o app para o Projeto de Extensão. O app também é peça de portfólio para vaga de front-end.

## 2. O que sabemos e o que supomos

**Informado pelo autor:**
- Dois balconistas trabalham em horários diferentes e precisam ver os mesmos pedidos.
- Precisa existir uma conta de admin que vê o log.
- O cliente precisa ver o cardápio e enviar pedido pelo celular.
- O atual problema: cada aparelho mostra só os próprios dados, e o cliente vê a tela do atendente.
- Foco da vaga: front-end. Banco e regras de acesso precisam ficar claros e explicados.

**Supomos (corrigir se estiver errado):**
- A pastelaria tem um só local e um único cardápio.
- Não há pagamento online nesta versão.
- O atendente confirma cada pedido recebido antes de preparar (proteção contra pedidos falsos).

## 3. Escopo

**Dentro do escopo:**
- Login para admin e balconistas (usuário e senha; e-mail só para recuperar a senha).
- Tela do atendente: novo pedido, pedidos do dia, resumo do dia, cardápio e log de ações. (O cadastro de balconistas é feito no painel do Supabase; veja a seção 9.)
- Tela do cliente: cardápio com itens disponíveis, carrinho, nome e tipo de pedido (retirada ou entrega), envio de pedido e acompanhamento do status em tempo real.
- Log de ações com quem, quando e o quê.
- Atualização em tempo real: pedido novo aparece na tela do atendente sem recarregar.
- Exportação do resumo do dia em CSV (já existe hoje).

**Fora do escopo (pode entrar depois):**
- Pagamento online (Pix e cartão são só registro).
- Entrega com endereço, taxa e rota.
- Impressão de pedido e controle de estoque.
- Notificação por WhatsApp ou push.
- Cadastro de balconistas feito pela própria tela do admin (nesta versão, o admin cria as contas no painel do Supabase, descrito na seção 9).
- Migração dos dados do app antigo (que ficam no navegador). O cardápio inicial é recriado a partir da lista de exemplo.
- Modo offline.

## 4. Arquitetura

- **Front-end:** React + Vite, TypeScript. Roteamento com React Router: `/` (cliente), `/atendente/*` (área protegida).
- **Banco e autenticação:** Supabase (PostgreSQL, Auth e Realtime). O front-end usa apenas a chave pública (anon key). A segurança fica nas regras de acesso do banco (Row Level Security, RLS), não na tela.
- **Hospedagem:** GitHub Pages, publicado por GitHub Actions a cada envio na branch principal. As variáveis do Supabase (URL e chave pública) entram no build por variáveis de ambiente do repositório.
- **Estilo:** CSS próprio com variáveis de tema, mobile-first. Sem biblioteca de componentes pesada, para manter o visual distinto.

Estrutura de pastas (módulos pequenos, cada um com uma responsabilidade):

```
src/
  lib/           # cliente Supabase, formatação, regras de cálculo (puras, testáveis)
  domain/        # tipos, total do pedido, numeração, tamanhos M/G
  services/      # funções que falam com o Supabase (pedidos, produtos, log, perfis)
  auth/          # sessão, proteção de rotas, papel (admin | balconista)
  features/
    cliente/     # cardápio público, carrinho, envio, acompanhamento
    atendente/   # novo pedido, pedidos, resumo, cardápio, log
  components/    # botões, cards, chips, modal, toast
  styles/        # tema e tokens
supabase/
  migrations/    # SQL das tabelas, funções, RLS e triggers de log
  tests/         # verificação das regras de acesso
```

## 5. Modelo de dados

**perfis** (um por usuário de Auth)
- `id` (uuid, mesmo id do Auth), `usuario` (único, usado no login), `nome`, `papel` (`admin` ou `balconista`), `ativo` (boolean)

**produtos**
- `id`, `nome`, `categoria` (`Pastéis`, `Bebidas`, `Outros`), `preco` (usado em Bebidas e Outros), `preco_m` e `preco_g` (usados em Pastéis), `ativo`, `criado_em`

**pedidos**
- `id` (uuid aleatório, gerado no banco; o aparelho do cliente guarda esse código para acompanhar o pedido), `numero` (sequencial por dia, gerado no banco), `dia` (data), `cliente` (texto livre, opcional), `tipo` (`Retirada` ou `Entrega`), `pagamento` (`Dinheiro`, `Pix`, `Cartão`), `observacao`, `status` (`recebido`, `preparando`, `pronto`, `entregue`, `cancelado`), `total` (calculado no banco), `criado_em`, `atualizado_por` (id do perfil, se foi o balconista)

**itens_pedido**
- `id`, `pedido_id`, `produto_id`, `nome_snapshot` (nome no momento da venda), `tamanho` (`M`, `G` ou nulo), `quantidade`, `preco_unitario` (snapshot)

**log_acoes**
- `id`, `quando`, `perfil_id` (quem fez), `acao` (`pedido_criado`, `status_alterado`, `pedido_cancelado`, `produto_criado`, `produto_editado`, `produto_excluido`, `preco_alterado`), `entidade` (tabela), `entidade_id`, `detalhes` (JSON com antes e depois)

Decisões:
- O preço fica gravado no item do pedido (snapshot). Assim, mudar o cardápio depois não altera vendas antigas.
- Itens de pedido são gravados por inteiro, num único envio (para não ficar pedido pela metade).
- Excluir produto só marca como inativo quando já existe venda, para não quebrar o histórico. O log registra a exclusão.

## 6. Regras de acesso (RLS)

| Quem | Produtos | Pedidos | Itens | Log |
|---|---|---|---|---|
| Visitante (cliente, sem login) | lê só `ativo = true` | cria pedido com status `recebido`; lê um pedido só pelo `id` que ele guardou (não lista pedidos) | cria junto com o pedido | nada |
| Balconista | lê tudo | lê, cria, altera status | lê | nada |
| Admin | lê, cria, edita, desativa | lê, cria, altera status, cancela | lê | lê |

Regras específicas:
- Visitante não consegue criar pedido com status diferente de `recebido`, nem com total informado por ele (o total é calculado no banco).
- Visitante não consegue listar pedidos. Ele só enxerga o pedido cujo `id` (uuid) recebeu ao enviar. Esse `id` é guardado no aparelho do cliente, para ele acompanhar o status depois. Como é um código aleatório, ninguém consegue adivinhar os pedidos dos outros.
- Balconista não consegue alterar cardápio nem ver log.
- Admin tem todas as permissões. Perfil desativado (`ativo = false`) perde o acesso mesmo com a conta de login ativa.
- Todo alteração em produtos e pedidos é gravada em `log_acoes` por trigger no banco, não pelo front-end. Assim o log não pode ser pulado.

## 7. Fluxos principais

**Cliente faz pedido**
1. Abre `/` e vê o cardápio (só itens disponíveis).
2. Monta o carrinho. Os totais aparecem na tela, mas quem calcula é o banco.
3. Informa nome (opcional), tipo e forma de pagamento.
4. Envia. O banco cria o pedido com status `recebido` e devolve o número.
5. A tela mostra o número e o status, que atualiza sozinho (realtime).

**Atendente registra e acompanha**
1. Entra em `/atendente` com usuário e senha.
2. Pedidos do cliente aparecem na aba Pedidos, com aviso sonoro e destaque.
3. **Aceita** o pedido: ele muda para `preparando` e a tela do cliente atualiza na hora. Depois marca como `pronto` e `entregue`. O cliente vê cada mudança sem recarregar a página.
4. Pode cancelar com confirmação. O cancelamento sai do total do dia, mas continua na lista.
5. Pode criar pedido pela aba Novo pedido (mesma tela que existe hoje), para quem chega ao balcão. Esse pedido é marcado como Retirada ou Entrega, como os pedidos do cliente.

**Admin**
- Tudo do balconista, mais: cardápio (criar, editar preço, marcar esgotado, excluir), resumo com filtro por dia, log de ações com filtro por balconista e data.

**Status do pedido**

```
```

Os nomes que o cliente vê dependem do tipo do pedido:

| Status interno | Retirada | Entrega |
|---|---|---|
| `recebido` | Recebido | Recebido |
| `preparando` | Preparando | Preparando |
| `pronto` | **Pronto** (pode retirar) | **Saiu para entrega** |
| `entregue` | Entregue | Entregue |
| `cancelado` | Cancelado | Cancelado |

Não é permitido voltar de status. Cancelado não volta. Pedidos de Entrega passam por "Saiu para entrega" antes de "Entregue". Pedidos de Retirada vão de "Pronto" direto para "Entregue".

## 8. Tratamento de erro e casos de borda

- Falha de rede no envio do pedido: a tela mantém o carrinho e mostra "Não foi possível enviar. Tente de novo." Nada é gravado parcialmente.
- Item esgotado depois de entrar no carrinho: o banco recusa o pedido e a tela avisa qual item saiu do cardápio.
- Dois pedidos ao mesmo tempo: a numeração do dia é gerada dentro de uma transação no banco, então não repete.
- Pedido falso de cliente (spam): o campo de armadilha (honeypot) bloqueia robôs simples. O atendente pode cancelar. Limite de pedidos por IP não é possível só no front-end; isso fica como risco aceito.
- Sessão expirada: o app manda para o login e não perde o que estava na tela de cadastro quando possível.
- Erro de RLS (acesso negado): mensagem genérica na tela e registro no console. Nunca mostra detalhes do banco para o cliente.

## 9. Contas de acesso

- Cada pessoa tem **usuário** e **senha** para entrar. O e-mail é usado só para recuperar a senha.
- O admin e cada balconista são criados no painel do Supabase (Authentication → Users). Cada conta recebe um e-mail próprio (um por pessoa), e o usuário fica guardado na tabela `perfis`.
- Papéis: o admin recebe `admin` e cada balconista recebe `balconista`.
- Login: a tela pede usuário e senha. O app procura o e-mail daquele usuário com uma função do banco que devolve apenas o e-mail do usuário informado (nunca a lista de contas) e então autentica.
- Esqueci a senha: o link de recuperação vai para o e-mail cadastrado.
- Trocar senha: pelo próprio link de recuperação.
- Remover acesso: marcar o perfil como `ativo = false`.
- Risco aceito: a função de busca de e-mail pelo usuário permite descobrir o e-mail de um usuário conhecido. Para uma pastelaria com poucos funcionários, isso é aceitável e fica registrado aqui.

Isso é manual de propósito nesta versão. Uma tela de cadastro de balconistas exigiria uma função de servidor com a chave privada, o que aumenta o trabalho sem trazer benefício para o uso da pastelaria.

## 10. Visual e experiência

Direção: **quente, de cozinha de bairro, com cara de marca própria**, não cara de painel genérico.

- Cores base do app atual: preto `#141414` e amarelo `#ffc914`, mais um creme `#f6f5f0` para o fundo. Acrescentar um tom de massa (dourado queimado) para destaques e estados.
- Tipografia: uma fonte de títulos com personalidade (ex.: uma serifada ou display de Google Fonts) e uma fonte de texto limpa, para leitura rápida na correria do balcão.
- Telas de cliente: cards grandes de produto com foto ou ícone, botões de quantidade fáceis de tocar (mínimo 44px), carrinho fixo na parte de baixo.
- Telas de atendente: cards de pedido com cor por status, que se vê de longe. Botões de avanço de status em destaque. Modo escuro opcional se houver tempo.
- Estados vazios e carregamento com mensagens claras, não tela branca.
- Movimento sutil (transições curtas) só para confirmar ações, sem animação que atrapalhe o atendimento.
- Acessibilidade: contraste AA, foco visível, rótulos em todos os campos.
- Design será feito seguindo a skill de frontend-design na fase de implementação.

## 11. Testes e verificação

- **Testes automáticos (Vitest):** total do pedido, preço M/G, numeração do dia, formatação em reais, transições de status válidas e inválidas.
- **Testes de acesso (SQL):** scripts em `supabase/tests` que tentam, com cada papel, ler, criar, alterar e apagar. O esperado está escrito em cada caso. Visitante não lista pedidos. Balconista não vê log. Cliente não cria pedido com status diferente de `recebido`.
- **Testes manuais:** roteiro com 10 passos (fazer pedido pelo celular, ver aparecer no computador do balcão, mudar status, cancelar, criar item, esgotar item, ver log, sair e entrar com outro balconista).
- **Teste real:** uma semana de uso na pastelaria antes da entrega, com anotação de problemas. Vira a etapa de "Verificação" do PDCA no relatório.

## 12. Implantação

- Repositório no GitHub com GitHub Actions para build e publicação no Pages.
- Projeto Supabase separado para produção e um para testes.
- Variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- README com: o que é o app, prints, como rodar localmente, como criar contas, como as regras de acesso funcionam, e a meta dos ODS escolhida (8.3).

## 13. Critérios de sucesso

- Um pedido feito no celular aparece no computador do balcão em menos de 3 segundos.
- Balconista não consegue ver o log nem alterar cardápio (verificado nos testes de acesso).
- Log registra quem fez cada alteração de pedido e de cardápio.
- Funciona em celular de tela pequena sem rolagem horizontal.
- Pelo menos uma semana de uso real na pastelaria, com anotações.
- Repositório com README, testes passando e publicação funcionando.

## 14. Riscos

| Risco | Efeito | Resposta |
|---|---|---|
| Prazo de 14 dias | Versão incompleta | Escopo enxuto; o que não couber vai para a lista de "depois" |
| Pedidos falsos de clientes | Cozinha prepara pedido errado | Atendente confirma antes de preparar; honeypot; cancelamento |
| Projeto pausado no plano gratuito do Supabase | App indisponível | Acessar o projeto uma vez por semana; avaliar plano pago se necessário |
| Chave pública exposta | Alguém lê dados que a RLS não protege | RLS revisada e testada; nada sensível fica liberado para visitante |
| Balconista esquece de sair | Outro usa a conta | Log mostra quem fez; senha pode ser trocada pelo admin |

## 15. Perguntas em aberto

Nenhuma. Todas as decisões desta versão estão acima. Se algo mudar durante a implementação, a mudança volta para o autor antes de ser feita.
