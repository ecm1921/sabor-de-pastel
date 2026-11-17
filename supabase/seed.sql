-- Cardápio inicial: os mesmos 8 itens e preços do app antigo.
insert into produtos (nome, categoria, preco, preco_m, preco_g) values
  ('Pastel de Carne',               'Pastéis', null, 15, 25),
  ('Pastel de Queijo',              'Pastéis', null, 15, 25),
  ('Pastel de Pizza',               'Pastéis', null, 15, 25),
  ('Pastel de Carne e Queijo',      'Pastéis', null, 15, 25),
  ('Pastel de Frango com Catupiry', 'Pastéis', null, 15, 25),
  ('Caldo de Cana',                 'Bebidas', 10, null, null),
  ('Refrigerante Lata',             'Bebidas', 10, null, null),
  ('Suco Natural',                  'Bebidas', 10, null, null);
