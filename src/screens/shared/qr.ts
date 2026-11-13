/* Conteúdo do QR Code da aula. Muda a cada 30 s para evitar foto compartilhada. */
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
export const slotNow = () => Math.floor(Date.now() / 30000);
export const qrPayload = (codigo: string, classId: string, date: string, slot = slotNow()) => `OSEKI|${classId}|${date}|${hash(codigo + classId + date + slot)}`;

export function validarQR(text: string, codigo: string, date: string): { ok: true; classId: string } | { ok: false; erro: string } {
  const p = text.split('|');
  if (p[0] !== 'OSEKI' || p.length !== 4) return { ok: false, erro: 'Este QR Code não é da academia.' };
  if (p[2] !== date) return { ok: false, erro: 'Este QR Code é de outro dia.' };
  const s = slotNow();
  for (let k = -2; k <= 1; k++) if (qrPayload(codigo, p[1], date, s + k) === text) return { ok: true, classId: p[1] };
  return { ok: false, erro: 'QR Code expirado. Leia o código atual na tela do professor.' };
}
