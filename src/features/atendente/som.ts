/** Dois bipes curtos para avisar que chegou pedido novo. Sem arquivo de som. */
export function tocarAviso(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.22].forEach((inicio) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      vol.gain.setValueAtTime(0.0001, ctx.currentTime + inicio);
      vol.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + inicio + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + 0.18);
      osc.connect(vol).connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + 0.2);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // navegador sem áudio: segue sem som
  }
}
