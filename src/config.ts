/*
 * Endereço do banco de dados (Supabase) da academia.
 * Fica em Supabase → Project Settings → API. A chave "anon/publishable" é pública
 * por natureza: quem protege os dados são as regras do arquivo supabase/schema.sql.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'https://zcgtufhttbdlcmyhmefe.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_8l7agvDJjk018oyeKLBrYA_PvL5nLHw';

/** "mobile" = app do aluno e do professor · "desktop" = painel administrativo */
export const TARGET: 'mobile' | 'desktop' = import.meta.env.VITE_TARGET === 'desktop' ? 'desktop' : 'mobile';
