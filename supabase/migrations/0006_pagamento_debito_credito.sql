-- Separa "Cartão" em "Débito" e "Crédito".
-- Pedidos antigos com "Cartão" (só os de teste, antes da loja usar) viram "Crédito".
alter table pedidos drop constraint pedidos_pagamento_check;
update pedidos set pagamento = 'Crédito' where pagamento = 'Cartão';
alter table pedidos add constraint pedidos_pagamento_check
  check (pagamento in ('Dinheiro', 'Pix', 'Débito', 'Crédito'));
