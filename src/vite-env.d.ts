/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_KEY?: string;
  readonly VITE_TARGET?: string;
}

declare const __VERSAO__: string;
