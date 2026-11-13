import type { BeltName, Grupo, Student, DB, Aula } from './types';

/* ---------- Datas ---------- */
export const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WD_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WD_INI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MES_LONG = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const p2 = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const todayIso = () => iso(today());
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const hhmm = (d = new Date()) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
/** "Qui, 12 nov" */
export const curta = (d: Date) => `${WD[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}`;
/** "12/11/2026" */
export const br = (d: Date) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
export const brShort = (d: Date) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
export const mesAno = (d: Date) => `${MES[d.getMonth()]} ${d.getFullYear()}`;

export function idadeDe(nasc: string) {
  const [d, m, y] = nasc.split('/').map(Number);
  if (!y) return 0;
  const t = new Date();
  let a = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a;
}
export const grupoDe = (s: Student): Grupo => { const i = idadeDe(s.nasc); return i < 11 ? 'Kids' : i <= 15 ? 'Teens' : 'Adulto'; };

/* ---------- Faixas ---------- */
export const BELTS: Record<BeltName, { cls: string; stripe?: 'branca' | 'preta'; color: string }> = {
  'Branca': { cls: 'branca', color: 'var(--belt-branca-borda)' },
  'Cinza e Branca': { cls: 'cinza', stripe: 'branca', color: 'var(--belt-cinza)' },
  'Cinza': { cls: 'cinza', color: 'var(--belt-cinza)' },
  'Cinza e Preta': { cls: 'cinza', stripe: 'preta', color: 'var(--belt-cinza)' },
  'Amarela e Branca': { cls: 'amarela', stripe: 'branca', color: 'var(--belt-amarela)' },
  'Amarela': { cls: 'amarela', color: 'var(--belt-amarela)' },
  'Amarela e Preta': { cls: 'amarela', stripe: 'preta', color: 'var(--belt-amarela)' },
  'Laranja e Branca': { cls: 'laranja', stripe: 'branca', color: 'var(--belt-laranja)' },
  'Laranja': { cls: 'laranja', color: 'var(--belt-laranja)' },
  'Laranja e Preta': { cls: 'laranja', stripe: 'preta', color: 'var(--belt-laranja)' },
  'Verde e Branca': { cls: 'verde', stripe: 'branca', color: 'var(--belt-verde)' },
  'Verde': { cls: 'verde', color: 'var(--belt-verde)' },
  'Verde e Preta': { cls: 'verde', stripe: 'preta', color: 'var(--belt-verde)' },
  'Azul': { cls: 'azul', color: 'var(--belt-azul)' },
  'Roxa': { cls: 'roxa', color: 'var(--belt-roxa)' },
  'Marrom': { cls: 'marrom', color: 'var(--belt-marrom)' },
  'Preta': { cls: 'preta', color: 'var(--belt-preta)' },
};
export const ADULTO: BeltName[] = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
export const INFANTIL: BeltName[] = ['Branca', 'Cinza e Branca', 'Cinza', 'Cinza e Preta', 'Amarela e Branca', 'Amarela', 'Amarela e Preta', 'Laranja e Branca', 'Laranja', 'Laranja e Preta', 'Verde e Branca', 'Verde', 'Verde e Preta'];
export const ALL_BELTS = Object.keys(BELTS) as BeltName[];

export function proximaFaixa(s: Student): BeltName | null {
  const seq = grupoDe(s) === 'Adulto' || ADULTO.includes(s.belt) && s.belt !== 'Branca' ? ADULTO : INFANTIL;
  const i = seq.indexOf(s.belt);
  if (i < 0 || i === seq.length - 1) return seq === INFANTIL ? 'Azul' : null;
  return seq[i + 1];
}
export const grausTxt = (g: number) => (g === 0 ? 'sem grau' : g === 1 ? '1 grau' : `${g} graus`);
export const ringOf = (b: BeltName) => BELTS[b].color;

export function metaDe(db: DB, s: Student) {
  const r = db.settings.requisitos;
  if (r[s.belt] != null) return r[s.belt];
  const fam = s.belt.split(' ')[0];
  const k = Object.keys(r).find((x) => x.startsWith(fam));
  return k ? r[k] : 20;
}

export const iniciais = (nome: string) => nome.split(' ').filter(Boolean).filter((_, i, a) => i === 0 || i === a.length - 1).map((p) => p[0]).join('').toUpperCase();
export const primeiro = (nome: string) => nome.split(' ')[0];

/* ---------- Aulas ---------- */
export const aulaById = (db: DB, id: string) => db.aulas.find((a) => a.id === id);
export const aulasDoDia = (db: DB, d: Date) => db.aulas.filter((a) => a.dias.includes(d.getDay())).sort((a, b) => a.ini.localeCompare(b.ini));
export const aulaLabel = (a?: Aula) => (a ? `${a.nome} · ${a.ini} – ${a.fim}` : '');

/** Aulas que o aluno pode frequentar: a turma dele + abertas a todos (open mat) */
export function aulasDoAluno(db: DB, s: Student) {
  const g = grupoDe(s);
  return db.aulas.filter((a) => a.id === s.turma || a.grupo === 'Todos' || a.grupo === g);
}

/** Sessões da turma principal entre duas datas (inclusive) */
export function sessoes(db: DB, s: Student, from: Date, to: Date) {
  const a = aulaById(db, s.turma);
  if (!a) return 0;
  let n = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) if (a.dias.includes(d.getDay())) n++;
  return n;
}

export function presencas(db: DB, sid: string, from?: Date, to?: Date) {
  const f = from ? iso(from) : '0000';
  const t = to ? iso(to) : '9999';
  return db.att.filter((x) => x.sid === sid && x.status === 'ok' && x.date >= f && x.date <= t);
}

export function freq(db: DB, s: Student, dias = 30) {
  const to = addDays(today(), -1);
  const from = addDays(today(), -dias);
  const total = sessoes(db, s, from, to);
  if (!total) return 0;
  const datas = new Set(presencas(db, s.id, from, to).map((x) => x.date));
  return Math.min(100, Math.round((datas.size / total) * 100));
}

export function freqMes(db: DB, s: Student, ref = today()) {
  const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const total = sessoes(db, s, from, ref);
  if (!total) return 0;
  const datas = new Set(presencas(db, s.id, from, ref).map((x) => x.date));
  return Math.min(100, Math.round((datas.size / total) * 100));
}

export function semanasSeguidas(db: DB, sid: string) {
  const ds = new Set(presencas(db, sid).map((x) => x.date));
  let n = 0;
  let start = addDays(today(), -today().getDay());
  // semana atual conta se já houver treino
  for (let w = 0; w < 60; w++) {
    let has = false;
    for (let i = 0; i < 7; i++) if (ds.has(iso(addDays(start, i)))) has = true;
    if (has) n++;
    else if (w > 0) break;
    start = addDays(start, -7);
  }
  return n;
}

/* ---------- Geolocalização ---------- */
export function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export const distTxt = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

/** Janela de check-in: 30 min antes até 15 min após o início */
export function naJanela(a: Aula, now = new Date()) {
  const [h, m] = a.ini.split(':').map(Number);
  const ini = new Date(now); ini.setHours(h, m, 0, 0);
  const diff = (now.getTime() - ini.getTime()) / 60000;
  return diff >= -30 && diff <= 15;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const pct = (a: number, b: number) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ---------- Mensalidade ---------- */
export const mesAtual = () => iso(today()).slice(0, 7);
export const brl = (v: number) => (v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor a definir');

/** Valor da mensalidade do aluno: preço do plano, com desconto de fundador. */
export function valorDe(db: DB, s: Student) {
  const base = db.settings.precos?.[s.plano] ?? 0;
  return s.fundador && s.plano !== 'avulso' ? Math.round(base * (100 - db.settings.fundadorDesconto)) / 100 : base;
}

/** Situação do mês atual, calculada pelos pagamentos registrados. */
export function situacao(db: DB, s: Student): { pay: Student['pay']; dias?: number } {
  const m = mesAtual();
  if ((s.pagamentos ?? []).some((p) => p.mes === m)) return { pay: 'pago' };
  if (s.payInformado === m) return { pay: 'analise' };
  const venc = db.settings.vencimento || 15;
  const dia = today().getDate();
  if (dia > venc) return { pay: 'atraso', dias: dia - venc };
  return { pay: 'aberto' };
}
