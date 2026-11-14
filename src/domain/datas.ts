const FUSO = "America/Sao_Paulo";

/** Data de hoje no horário de Brasília, no formato AAAA-MM-DD. */
export const hojeSP = (agora = new Date()) => agora.toLocaleDateString("en-CA", { timeZone: FUSO });

/** "2026-11-14" → "14/11/2026" */
export const formatarData = (dia: string) => dia.split("-").reverse().join("/");
