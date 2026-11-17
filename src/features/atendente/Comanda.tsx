import type { Pedido } from "../../domain/tipos";
import { formatarBRL } from "../../domain/pedido";
import { formatarData } from "../../domain/datas";
import { formatarEndereco, formatarTelefone } from "../../domain/whatsapp";
import "./comanda.css";

/** Comanda para impressora térmica de 80 mm. */
export function Comanda({ pedido: p }: { pedido: Pedido }) {
  return (
    <div className="comanda">
      <p className="comanda__marca">Sabor de Pastel</p>
      <p className="comanda__numero">Pedido nº {p.numero}</p>
      <p>
        {formatarData(p.dia)} {p.hora}
      </p>
      <p className="comanda__tipo">{p.tipo}</p>
      <hr />
      {p.itens.map((i, n) => (
        <p key={n} className="comanda__item">
          <span>
            {i.quantidade}x {i.nome}
            {i.tamanho ? ` (${i.tamanho})` : ""}
          </span>
          <span>{formatarBRL(i.precoUnitario * i.quantidade)}</span>
        </p>
      ))}
      <hr />
      <p className="comanda__item comanda__total">
        <span>Total</span>
        <span>{formatarBRL(p.total)}</span>
      </p>
      <p>Pagamento: {p.pagamento}</p>
      {p.observacao && <p>Obs.: {p.observacao}</p>}
      <hr />
      {p.cliente && <p>Cliente: {p.cliente}</p>}
      <p>Telefone: {formatarTelefone(p.telefone)}</p>
      {p.tipo === "Entrega" && p.endereco && (
        <>
          <p>Endereço: {formatarEndereco(p.endereco)}</p>
          {p.endereco.referencia && <p>Referência: {p.endereco.referencia}</p>}
        </>
      )}
    </div>
  );
}
