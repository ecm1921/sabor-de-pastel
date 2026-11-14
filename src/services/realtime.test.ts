import { it, expect, vi } from "vitest";

let aoInscrever: (status: string) => void = () => {};
const canal = {
  on: vi.fn(() => canal),
  subscribe: vi.fn((f: (status: string) => void) => {
    aoInscrever = f;
    return canal;
  }),
};
vi.mock("./supabase", () => ({ supabase: { channel: () => canal, removeChannel: vi.fn() } }));

import { assinarPedidosDoDia } from "./pedidos";

it("ao (re)conectar o tempo real, recarrega a fila para pegar o que chegou durante a queda", () => {
  const aoMudar = vi.fn();
  assinarPedidosDoDia("2026-11-14", aoMudar);
  aoInscrever("CHANNEL_ERROR");
  expect(aoMudar).not.toHaveBeenCalled();
  aoInscrever("SUBSCRIBED");
  expect(aoMudar).toHaveBeenCalledTimes(1);
});
