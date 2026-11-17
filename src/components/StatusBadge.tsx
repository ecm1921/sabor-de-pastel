import type { Status, Tipo } from "../domain/tipos";
import { rotuloStatus } from "../domain/pedido";

export function StatusBadge({ status, tipo }: { status: Status; tipo: Tipo }) {
  return (
    <span className="status" data-status={status}>
      {rotuloStatus(status, tipo)}
    </span>
  );
}
