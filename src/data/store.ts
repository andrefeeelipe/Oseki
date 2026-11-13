import { useSyncExternalStore } from 'react';
import type { DB, Attendance, AttVia, Notif, Student, BeltName } from './types';
import { buildSeed } from './seed';
import { aulaById, br, hhmm, iso, metaDe, primeiro, proximaFaixa, today, uid, grausTxt, MES } from './util';

/*
 * Banco local (localStorage). Todas as telas — aluno, professor e painel —
 * leem e escrevem aqui, então o que um perfil faz aparece no outro na hora.
 * Para sincronizar entre aparelhos, troque este arquivo por um backend
 * (ex.: Supabase/Firebase) mantendo as mesmas funções exportadas.
 */
const KEY = 'oseki-db-v1';
let db: DB = load();
const subs = new Set<() => void>();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as DB;
      if (d.version === 1) return d;
    }
  } catch { /* armazenamento indisponível */ }
  return buildSeed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* cheio ou bloqueado */ }
}
function emit() { subs.forEach((f) => f()); }

export function useDB(): DB {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => db);
}
export const getDB = () => db;

export function update(fn: (d: DB) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  save();
  emit();
}

export function resetDemo() {
  const session = db.session;
  db = buildSeed();
  db.session = session;
  save();
  emit();
}

/* Sincroniza abas abertas no mesmo aparelho (ex.: aluno numa aba, professor noutra) */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) { db = JSON.parse(e.newValue); emit(); }
  });
}

/* ---------- Toast ---------- */
let toastMsg = '';
let toastT: number | undefined;
const toastSubs = new Set<() => void>();
export function toast(m: string) {
  toastMsg = m;
  toastSubs.forEach((f) => f());
  clearTimeout(toastT);
  toastT = window.setTimeout(() => { toastMsg = ''; toastSubs.forEach((f) => f()); }, 2600);
}
export const useToast = () => useSyncExternalStore((f) => { toastSubs.add(f); return () => toastSubs.delete(f); }, () => toastMsg);

/* ---------- Helpers ---------- */
const st = (d: DB, sid: string) => d.students.find((s) => s.id === sid)!;
function notify(d: DB, to: string, t: string, desc: string, kind: Notif['kind']) {
  d.notifs.unshift({ id: uid(), to, t, d: desc, at: new Date().toISOString(), kind, read: false });
}
function contar(d: DB, s: Student) {
  s.aulas += 1;
  const meta = metaDe(d, s);
  if (s.aulas === meta) notify(d, 'prof', `${s.nome} bateu a meta`, `${meta} aulas na faixa ${s.belt.toLowerCase()}. Pronto para graduar.`, 'meta');
}

/* ---------- Sessão ---------- */
export const login = (role: 'aluno' | 'prof' | 'admin', sid?: string) => update((d) => { d.session = { role, sid }; });
export const logout = () => update((d) => { d.session = null; });

/* ---------- Presença ---------- */
export function marcarPresenca(sid: string, classId: string, date: string, via: AttVia): Attendance['status'] {
  let result: Attendance['status'] = 'pend';
  update((d) => {
    const s = st(d, sid);
    const a = aulaById(d, classId);
    const ex = d.att.find((x) => x.sid === sid && x.date === date && x.classId === classId);
    if (ex && ex.status !== 'rej') { result = ex.status; return; }
    const auto = (via === 'gps' || via === 'qr') && !d.settings.revisarGps;
    const rec: Attendance = { id: uid(), sid, date, classId, status: auto ? 'ok' : 'pend', via, at: hhmm(), sentAt: brShortNow() };
    if (ex) d.att.splice(d.att.indexOf(ex), 1);
    d.att.push(rec);
    result = rec.status;
    if (auto) {
      contar(d, s);
      if (via === 'gps') d.geoChegada[sid] = date;
      notify(d, 'prof', `${primeiro(s.nome)} chegou ${via === 'gps' ? 'por GPS' : 'pelo QR Code'}`, `${a?.nome ?? ''} · presença registrada às ${rec.at}.`, 'gps');
      notify(d, sid, 'Presença registrada', `${a?.nome ?? ''} · ${via === 'gps' ? 'você chegou na academia' : 'QR Code lido'} às ${rec.at}.`, 'ok');
    } else {
      notify(d, 'prof', `${s.nome} marcou presença`, `${a?.nome ?? ''}, ${br(fromIsoSafe(date)).slice(0, 5)}. Toque para aprovar.`, 'pend');
    }
  });
  return result as Attendance['status'];
}
const brShortNow = () => { const n = new Date(); return `${br(n).slice(0, 5)} ${hhmm(n)}`; };
const fromIsoSafe = (s: string) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };

export function decidir(attId: string, ok: boolean) {
  update((d) => {
    const x = d.att.find((a) => a.id === attId);
    if (!x || x.status !== 'pend') return;
    x.status = ok ? 'ok' : 'rej';
    const s = st(d, x.sid);
    const a = aulaById(d, x.classId);
    if (ok) contar(d, s);
    notify(d, x.sid, ok ? 'Presença aprovada' : 'Presença recusada', `${a?.nome ?? ''} · ${br(fromIsoSafe(x.date)).slice(0, 5)}${ok ? '' : '. Fale com o professor se foi engano.'}`, ok ? 'ok' : 'info');
  });
}
export function aprovarTodas() { getDB().att.filter((x) => x.status === 'pend').forEach((x) => decidir(x.id, true)); }

/** Professor marca o aluno na chamada (ou desmarca). */
export function profMarcar(sid: string, classId: string, date = iso(today())) {
  update((d) => {
    const ex = d.att.find((x) => x.sid === sid && x.date === date && x.classId === classId);
    const s = st(d, sid);
    if (ex) {
      if (ex.status === 'ok') { d.att.splice(d.att.indexOf(ex), 1); s.aulas = Math.max(0, s.aulas - 1); return; }
      ex.status = 'ok'; ex.via = ex.via === 'app' ? 'app' : 'prof'; contar(d, s); return;
    }
    d.att.push({ id: uid(), sid, date, classId, status: 'ok', via: 'prof', at: hhmm() });
    contar(d, s);
  });
}

/* ---------- Faixa e anotações ---------- */
export function setFaixa(sid: string, belt: BeltName, graus: number) {
  update((d) => {
    const s = st(d, sid);
    const mudouFaixa = s.belt !== belt;
    if (mudouFaixa || s.graus !== graus) {
      const now = new Date();
      s.hist.unshift({ t: mudouFaixa ? `Faixa ${belt.toLowerCase()}` : `${graus}º grau`, d: `${MES[now.getMonth()]} ${now.getFullYear()}` });
      if (mudouFaixa || graus > s.graus) s.aulas = 0;
      notify(d, sid, mudouFaixa ? 'Nova faixa!' : 'Grau atualizado', `${belt} · ${grausTxt(graus)}. Oss!`, 'grad');
    }
    s.belt = belt; s.graus = graus;
  });
}
export function setApto(sid: string, v: boolean) {
  update((d) => { const s = st(d, sid); s.apto = v; if (v) notify(d, sid, 'Você está apto para o exame', 'A avaliação técnica foi liberada pelo professor.', 'grad'); });
}
export function addNote(sid: string, t: string) {
  update((d) => {
    st(d, sid).notes.unshift({ d: br(new Date()), t, by: 'Prof. Marangoni' });
    notify(d, sid, 'Nova anotação do professor', t, 'nota');
  });
}
/** Gradua: +1 grau, ou próxima faixa se já tem 4 graus. */
export function graduar(sids: string[]) {
  for (const sid of sids) {
    const s = getDB().students.find((x) => x.id === sid)!;
    if (s.graus < 4) setFaixa(sid, s.belt, s.graus + 1);
    else { const nf = proximaFaixa(s); if (nf) setFaixa(sid, nf, 0); }
    update((d) => { st(d, sid).apto = false; });
  }
}
export const nextStep = (s: Student) => (s.graus < 4 ? `${s.graus + 1}º grau` : `faixa ${(proximaFaixa(s) ?? s.belt).toLowerCase()}`);

/* ---------- Avisos e notificações ---------- */
export function lerTodas(to: string) { update((d) => d.notifs.forEach((n) => { if (n.to === to) n.read = true; })); }
export function enviarAviso(para: string, titulo: string, msg: string, grupoDe: (s: Student) => string) {
  update((d) => {
    d.avisos.unshift({ id: uid(), para, titulo, msg, at: new Date().toISOString() });
    d.students.filter((s) => para === 'Todos' || grupoDe(s) === para).forEach((s) => notify(d, s.id, titulo, msg, 'aviso'));
  });
}
export { notify };
