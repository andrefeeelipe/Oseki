import type { DB, PlanoId, Settings } from './types';

/* Valores padrão. Os dados reais vêm do banco (supabase/schema.sql cria a primeira versão). */
export const DEFAULT_SETTINGS: Settings = {
  academia: 'Oseki BJJ',
  equipe: 'Marangoni BJJ / Oseki BJJ',
  endereco: '',
  whatsapp: '',
  codigo: 'OSEKI-2026',
  lat: null, lng: null, raio: 100, revisarGps: false,
  metodos: { gps: true, qr: true, app: true },
  proximoExame: null,
  planoAula: { tecnica: '', passos: [] },
  requisitos: { 'Branca': 40, 'Cinza e Branca': 20, 'Amarela': 20, 'Laranja': 20, 'Verde': 20, 'Azul': 60, 'Roxa': 60, 'Marrom': 60, 'Preta': 80 },
  fundadorVagas: 50, fundadorDesconto: 15, fundadorTolerancia: 10,
  conteudo: {},
  rankingPublicado: false,
  precos: { avulso: 0, mensal: 0, trimestral: 0, semestral: 0, anual: 0 },
  vencimento: 15,
  chavePix: '',
};

export function emptyDB(): DB {
  return {
    version: 2, seededAt: new Date().toISOString(),
    students: [], profs: [], att: [], aulas: [], notifs: [], tecnicas: [], access: [],
    settings: structuredClone(DEFAULT_SETTINGS), session: null, geoChegada: {}, avisos: [],
  };
}

export const PLANOS: { id: PlanoId; nome: string; desc: string; per: string; meses: number }[] = [
  { id: 'avulso', nome: 'Avulso', desc: 'Aula única ou pacote · sem fidelidade', per: 'por aula', meses: 0 },
  { id: 'mensal', nome: 'Mensal', desc: 'Aulas ilimitadas · cancele quando quiser', per: 'por mês', meses: 1 },
  { id: 'trimestral', nome: 'Trimestral', desc: '3 meses · + open mat e competição', per: 'por mês', meses: 3 },
  { id: 'semestral', nome: 'Semestral', desc: '6 meses · + seminários gravados', per: 'por mês', meses: 6 },
  { id: 'anual', nome: 'Anual', desc: '12 meses · tudo liberado + treino individual', per: 'por mês', meses: 12 },
];
export const planoNome = (id: PlanoId) => PLANOS.find((p) => p.id === id)?.nome ?? id;
