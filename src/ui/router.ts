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
