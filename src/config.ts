/*
 * Endereço do banco de dados (Supabase) da academia.
 * Fica em Supabase → Project Settings → API. A chave "anon/publishable" é pública
 * por natureza: quem protege os dados são as regras do arquivo supabase/schema.sql.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || '';

/** "mobile" = app do aluno e do professor · "desktop" = painel administrativo */
export const TARGET: 'mobile' | 'desktop' = import.meta.env.VITE_TARGET === 'desktop' ? 'desktop' : 'mobile';
