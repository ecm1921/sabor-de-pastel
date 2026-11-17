// Aviso sonoro de pedido novo. Os navegadores só liberam som depois que a pessoa toca na página,
// então o som é liberado no primeiro toque/tecla ou pelo botão "Ativar som".

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

/** true quando o som já pode tocar (ou quando o aparelho não tem som, e não há o que liberar). */
export function somAtivo(): boolean {
  const c = contexto();
  return !c || c.state === "running";
}

export async function ativarSom(): Promise<void> {
  try {
    await contexto()?.resume();
  } catch {
    // sem som: segue sem aviso sonoro
  }
}

if (typeof document !== "undefined") {
  const liberar = () => void ativarSom();
  document.addEventListener("pointerdown", liberar, { once: true });
  document.addEventListener("keydown", liberar, { once: true });
}

/** Dois bipes curtos. Sem arquivo de som. */
export function tocarAviso(): void {
  try {
    const c = contexto();
    if (!c) return;
    [0, 0.22].forEach((inicio) => {
      const osc = c.createOscillator();
      const vol = c.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      vol.gain.setValueAtTime(0.0001, c.currentTime + inicio);
      vol.gain.exponentialRampToValueAtTime(0.4, c.currentTime + inicio + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + 0.18);
      osc.connect(vol).connect(c.destination);
      osc.start(c.currentTime + inicio);
      osc.stop(c.currentTime + inicio + 0.2);
    });
  } catch {
    // navegador sem áudio: segue sem som
  }
}
