import { useSyncExternalStore } from 'react';

/* Roteador por hash: funciona no GitHub Pages e dentro do APK sem servidor. */
const get = () => (location.hash.replace(/^#\/?/, '') || '');
export function useRoute() {
  const h = useSyncExternalStore((f) => { addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, get);
  return h.split('/').filter(Boolean);
}
export const go = (path: string) => { location.hash = '/' + path.replace(/^\//, ''); };
export const back = (fallback: string) => {
  if (history.length > 1 && (history.state as unknown) !== 'root') history.back();
  else go(fallback);
};

/* ---------- Botão "voltar" do Android ---------- */
/** Janelas abertas (folhas, modais) que o botão voltar deve fechar primeiro. */
export const fecharAbertos: Array<() => void> = [];

/** Volta uma tela. Retorna false quando já está na tela inicial (o app então vai para segundo plano). */
export function voltarUmaTela(): boolean {
  const f = fecharAbertos[fecharAbertos.length - 1];
  if (f) { f(); return true; }
  const r = get().split('/').filter(Boolean);
  const casa = r[0] === 'prof' ? 'prof/chamada' : 'aluno/inicio';
  if (r.length === 0 || (r[0] !== 'aluno' && r[0] !== 'prof') || r.join('/') === casa) return false;
  if (r.length <= 2) { go(casa); return true; } // outra aba: volta para o início
  history.back();
  return true;
}
