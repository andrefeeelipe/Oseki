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

/* Pilha própria de telas visitadas: não depende do histórico do WebView. */
const pilha: string[] = [get()];
let voltando = false;
addEventListener('hashchange', () => {
  const h = get();
  if (voltando) { voltando = false; return; }
  if (pilha[pilha.length - 1] !== h) pilha.push(h);
  if (pilha.length > 60) pilha.splice(0, pilha.length - 60);
});

/** Volta uma tela. Retorna false quando já está na tela inicial (o app então vai para segundo plano). */
export function voltarUmaTela(): boolean {
  const f = fecharAbertos[fecharAbertos.length - 1];
  if (f) { f(); return true; }
  const r = get().split('/').filter(Boolean);
  const casa = r[0] === 'prof' ? 'prof/chamada' : 'aluno/inicio';
  if (r.length === 0 || (r[0] !== 'aluno' && r[0] !== 'prof') || r.join('/') === casa) return false;
  pilha.pop();
  while (pilha.length && (pilha[pilha.length - 1] === get() || !pilha[pilha.length - 1].startsWith(r[0] + '/'))) pilha.pop();
  const anterior = pilha[pilha.length - 1] ?? casa;
  voltando = true;
  location.replace('#/' + anterior);
  return true;
}
