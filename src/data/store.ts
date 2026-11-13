import { useSyncExternalStore } from 'react';
import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { DB, Attendance, AttVia, Notif, Student, BeltName, Prof, Settings } from './types';
import { emptyDB, DEFAULT_SETTINGS } from './seed';
import { aulaById, br, hhmm, iso, metaDe, primeiro, proximaFaixa, today, uid, grausTxt, MES, situacao, addDays } from './util';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';

/*
 * Dados da academia. Tudo fica no Supabase (banco online) e uma cópia fica no
 * aparelho para abrir rápido. As telas alteram os dados com update(); este
 * arquivo descobre o que mudou e grava só isso no banco. As regras de quem pode
 * mudar o quê ficam no banco (supabase/schema.sql), não aqui.
 */
export const sb: SupabaseClient | null = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const CACHE = 'oseki-cache-v2';
let db: DB = loadCache();
const subs = new Set<() => void>();
function loadCache(): DB {
  try { const r = localStorage.getItem(CACHE); if (r) { const d = JSON.parse(r) as DB; if (d.version === 2) return d; } } catch { /* sem cache */ }
  return emptyDB();
}
function saveCache() { try { localStorage.setItem(CACHE, JSON.stringify({ ...db, segredos: undefined })); } catch { /* cheio */ } }
function emit() { subs.forEach((f) => f()); }
function setDB(d: DB) { db = normalize(d); saveCache(); emit(); }

export function useDB(): DB { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => db); }
export const getDB = () => db;

/* ---------- Estado da conexão / login ---------- */
export type AuthState = 'sem-servidor' | 'carregando' | 'deslogado' | 'completar' | 'pronto' | 'nova-senha';
let auth: AuthState = sb ? 'carregando' : 'sem-servidor';
let authErr = '';
const authSubs = new Set<() => void>();
function setAuth(a: AuthState) { auth = a; authSubs.forEach((f) => f()); emit(); }
export const useAuth = () => useSyncExternalStore((f) => { authSubs.add(f); return () => authSubs.delete(f); }, () => auth);
export const authErro = () => authErr;

/* ---------- Toast ---------- */
let toastMsg = '';
let toastT: number | undefined;
const toastSubs = new Set<() => void>();
export function toast(m: string) {
  toastMsg = m;
  toastSubs.forEach((f) => f());
  clearTimeout(toastT);
  toastT = window.setTimeout(() => { toastMsg = ''; toastSubs.forEach((f) => f()); }, 3000);
}
export const useToast = () => useSyncExternalStore((f) => { toastSubs.add(f); return () => toastSubs.delete(f); }, () => toastMsg);

/* ---------- Conversão entre o app e as tabelas ---------- */
const omit = <T extends object>(o: T, ks: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !ks.includes(k)));

export function novoAluno(p: Partial<Student> & { id: string }): Student {
  return {
    nome: '', email: '', belt: 'Branca', graus: 0, aulas: 0, apto: false, nasc: '', turma: '', tel: '', resp: '',
    notes: [], hist: [], desde: '', matricula: '', plano: 'mensal', mesesEmDia: 0, pay: 'aberto', pagamentos: [],
    contrato: { assinado: false, vig: '—', renova: true, status: 'assin' }, tecnicas: {}, geoAuto: true, notif: true, status: 'ativo',
    ...p,
  } as Student;
}
const toRowStudent = (s: Student) => ({ id: s.id, role: 'aluno', data: omit(s, ['id', 'pay', 'payDias']) });
const toRowProf = (p: Prof) => ({ id: p.id, role: p.role, data: omit(p, ['id', 'role']) });
const toRowAtt = (a: Attendance) => ({ id: a.id, sid: a.sid, date: a.date, status: a.status, data: { classId: a.classId, via: a.via, at: a.at, sentAt: a.sentAt ?? null } });
const toRowNotif = (n: Notif) => ({ id: n.id, dest: n.to, data: omit(n, ['id', 'to']) });
const toRowGen = (x: { id: string }) => ({ id: x.id, data: x });

type Row = { id: string; [k: string]: unknown };
const TABLES: [string, (d: DB) => Row[]][] = [
  ['profiles', (d) => [...d.students.map(toRowStudent), ...d.profs.map(toRowProf)]],
  ['att', (d) => d.att.map(toRowAtt)],
  ['notifs', (d) => d.notifs.map(toRowNotif)],
  ['aulas', (d) => d.aulas.map(toRowGen)],
  ['tecnicas', (d) => d.tecnicas.map(toRowGen)],
  ['access', (d) => d.access.map(toRowGen)],
  ['avisos', (d) => d.avisos.map(toRowGen)],
];

function normalize(d: DB): DB {
  for (const s of d.students) { const x = situacao(d, s); s.pay = x.pay; s.payDias = x.dias; }
  return d;
}

/* ---------- Carregar do banco ---------- */
let loading: Promise<void> | null = null;
export function reload() { if (!loading) loading = carregar().finally(() => { loading = null; }); return loading; }

async function carregar() {
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) { setAuth('deslogado'); return; }
  const me = await sb.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
  if (me.error) { authErr = me.error.message; toast('Sem conexão com o servidor. Mostrando os últimos dados salvos.'); if (db.session) setAuth('pronto'); return; }
  if (!me.data) {
    const pend = pendente();
    if (pend) {
      const r = await sb.rpc('criar_perfil', { p_codigo: pend.codigo, p_role: pend.role, p_data: pend.data });
      localStorage.removeItem(PEND);
      if (r.error) { authErr = r.error.message; setAuth('completar'); return; }
      return carregar();
    }
    setAuth('completar');
    return;
  }
  const role = me.data.role as 'aluno' | 'prof' | 'admin';
  const staff = role !== 'aluno';
  const desde = iso(addDays(today(), -200));
  const [settings, aulas, tecnicas, notifs] = await Promise.all([
    sb.from('settings').select('data').eq('id', 1).maybeSingle(),
    sb.from('aulas').select('*'),
    sb.from('tecnicas').select('*'),
    sb.from('notifs').select('*').order('created_at', { ascending: false }).limit(300),
  ]);
  const d = emptyDB();
  d.settings = { ...DEFAULT_SETTINGS, ...(settings.data?.data ?? {}) } as Settings;
  d.aulas = (aulas.data ?? []).map((r) => ({ ...r.data, id: r.id }));
  d.tecnicas = (tecnicas.data ?? []).map((r) => ({ ...r.data, id: r.id }));
  d.notifs = (notifs.data ?? []).map((r) => ({ at: r.created_at, read: false, kind: 'info', t: '', d: '', ...r.data, id: r.id, to: r.dest }));
  const attFrom = (rows: { id: string; sid: string; date: string; status: Attendance['status']; data: Record<string, unknown> }[]) =>
    rows.map((r) => ({ via: 'app', at: '', classId: '', ...r.data, id: r.id, sid: r.sid, date: String(r.date).slice(0, 10), status: r.status }) as Attendance);

  if (staff) {
    const [profiles, att, access, avisos, seg] = await Promise.all([
      sb.from('profiles').select('*'),
      sb.from('att').select('*').gte('date', iso(new Date(today().getFullYear() - 1, 0, 1))),
      sb.from('access').select('*'),
      sb.from('avisos').select('*'),
      sb.from('segredos').select('codigo_aluno, codigo_prof').eq('id', 1).maybeSingle(),
    ]);
    for (const r of profiles.data ?? []) {
      if (r.role === 'aluno') d.students.push(novoAluno({ ...r.data, id: r.id }));
      else d.profs.push({ belt: 'Preta', graus: 0, nome: '', email: '', tel: '', ...r.data, id: r.id, role: r.role });
    }
    d.att = attFrom(att.data ?? []);
    d.access = (access.data ?? []).map((r) => ({ ...r.data, id: r.id }));
    d.avisos = (avisos.data ?? []).map((r) => ({ ...r.data, id: r.id }));
    d.segredos = seg.data ?? undefined;
  } else {
    const [dir, att, rank] = await Promise.all([
      sb.rpc('diretorio'),
      sb.from('att').select('*'),
      sb.rpc('presencas_ranking', { p_desde: desde }),
    ]);
    for (const r of (dir.data ?? []) as { id: string; role: string; data: Record<string, unknown> }[]) {
      const clean = Object.fromEntries(Object.entries(r.data).filter(([, v]) => v != null));
      if (r.id === me.data.id) continue;
      if (r.role === 'aluno') d.students.push(novoAluno({ ...clean, id: r.id }));
      else d.profs.push({ belt: 'Preta', graus: 0, nome: '', email: '', tel: '', ...clean, id: r.id, role: r.role as Prof['role'] });
    }
    d.students.unshift(novoAluno({ ...me.data.data, id: me.data.id }));
    const mine = attFrom(att.data ?? []);
    const ids = new Set(mine.map((x) => x.id));
    d.att = [...mine, ...attFrom((rank.data ?? []) as never[]).filter((x) => !ids.has(x.id))];
  }
  if (staff && !d.profs.some((p) => p.id === me.data.id)) d.profs.push({ belt: 'Preta', graus: 0, nome: '', email: '', tel: '', ...me.data.data, id: me.data.id, role });
  d.geoChegada = db.geoChegada ?? {};
  d.session = { role, sid: me.data.id, email: u.user.email ?? '' };
  setDB(d);
  setAuth('pronto');
  ouvir();
}

/* Tempo real: qualquer mudança no banco atualiza a tela de todo mundo */
let canal: RealtimeChannel | null = null;
let rt: number | undefined;
function ouvir() {
  if (!sb || canal) return;
  canal = sb.channel('oseki').on('postgres_changes', { event: '*', schema: 'public' }, () => { clearTimeout(rt); rt = window.setTimeout(() => reload(), 700); }).subscribe();
  window.setInterval(() => { if (auth === 'pronto' && document.visibilityState === 'visible') reload(); }, 60000);
}

if (sb) {
  sb.auth.onAuthStateChange((ev) => {
    if (ev === 'PASSWORD_RECOVERY') { setAuth('nova-senha'); return; }
    if (auth === 'nova-senha') return;
    if (ev === 'SIGNED_OUT') { db = emptyDB(); saveCache(); setAuth('deslogado'); }
    else if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') reload();
  });
}

/* ---------- Gravar só o que mudou ---------- */
let fila: Promise<void> = Promise.resolve();
export function update(fn: (d: DB) => void) {
  const prev = db;
  const next = structuredClone(db);
  fn(next);
  setDB(next);
  fila = fila.then(() => gravar(prev, next)).catch(() => undefined);
  return fila;
}

async function gravar(prev: DB, next: DB) {
  if (!sb) return;
  try {
    for (const [table, rows] of TABLES) {
      const a = new Map(rows(prev).map((r) => [r.id, JSON.stringify(r)]));
      const b = rows(next);
      const novos = b.filter((r) => !a.has(r.id));
      const mudados = b.filter((r) => a.has(r.id) && a.get(r.id) !== JSON.stringify(r));
      const ids = new Set(b.map((r) => r.id));
      const removidos = [...a.keys()].filter((id) => !ids.has(id));
      if (novos.length) { const r = await sb.from(table).insert(novos); if (r.error) throw r.error; }
      for (const m of mudados) { const r = await sb.from(table).update(omit(m, ['id'])).eq('id', m.id); if (r.error) throw r.error; }
      if (removidos.length) { const r = await sb.from(table).delete().in('id', removidos); if (r.error) throw r.error; }
    }
    if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) {
      const r = await sb.from('settings').upsert({ id: 1, data: next.settings }); if (r.error) throw r.error;
    }
    if (next.segredos && JSON.stringify(prev.segredos) !== JSON.stringify(next.segredos)) {
      const r = await sb.from('segredos').update(next.segredos).eq('id', 1); if (r.error) throw r.error;
    }
  } catch (e) {
    toast('Não foi possível salvar. Verifique a internet e tente de novo.');
    console.error(e);
    reload();
  }
}

/* ---------- Conta ---------- */
const PEND = 'oseki-cadastro-pendente';
type Pend = { role: 'aluno' | 'prof'; codigo: string; data: Record<string, unknown> };
const pendente = (): Pend | null => { try { return JSON.parse(localStorage.getItem(PEND) ?? 'null'); } catch { return null; } };

export async function entrar(email: string, senha: string) {
  if (!sb) return 'Servidor não configurado.';
  const r = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (r.error) return r.error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : r.error.message.includes('not confirmed') ? 'Confirme o e-mail antes de entrar (veja sua caixa de entrada).' : r.error.message;
  return null;
}

export async function cadastrar(email: string, senha: string, p: Pend) {
  if (!sb) return 'Servidor não configurado.';
  const mail = email.trim().toLowerCase();
  localStorage.setItem(PEND, JSON.stringify({ ...p, data: { ...p.data, email: mail } }));
  const r = await sb.auth.signUp({ email: mail, password: senha });
  if (r.error) {
    localStorage.removeItem(PEND);
    if (r.error.message.includes('already registered')) return 'Este e-mail já tem conta. Use "Entrar".';
    if (r.error.message.toLowerCase().includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
    return r.error.message;
  }
  if (!r.data.session) return 'confirmar';
  await reload();
  return auth === 'completar' ? authErr || 'Não foi possível concluir o cadastro.' : null;
}

export async function completarCadastro(p: Pend) {
  if (!sb) return 'Servidor não configurado.';
  const { data: u } = await sb.auth.getUser();
  const r = await sb.rpc('criar_perfil', { p_codigo: p.codigo, p_role: p.role, p_data: { ...p.data, email: u.user?.email ?? '' } });
  if (r.error) return r.error.message;
  await reload();
  return null;
}

export async function codigoInicial(): Promise<string | null> {
  if (!sb) return null;
  const r = await sb.rpc('codigo_inicial');
  return (r.data as string | null) ?? null;
}

export async function esqueciSenha(email: string) {
  if (!sb) return 'Servidor não configurado.';
  const r = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: location.origin + location.pathname });
  return r.error ? r.error.message : null;
}
export async function trocarSenha(nova: string) {
  if (!sb) return 'Servidor não configurado.';
  const r = await sb.auth.updateUser({ password: nova });
  if (r.error) return r.error.message;
  auth = 'carregando';
  await reload();
  return null;
}
export async function sair() { if (sb) await sb.auth.signOut(); db = emptyDB(); saveCache(); setAuth('deslogado'); }
export const logout = () => { sair(); };

/* ---------- Helpers ---------- */
const st = (d: DB, sid: string) => d.students.find((s) => s.id === sid)!;
function notify(d: DB, to: string, t: string, desc: string, kind: Notif['kind']) {
  d.notifs.unshift({ id: uid() + uid(), to, t, d: desc, at: new Date().toISOString(), kind, read: false });
}
/** O banco conta a aula; aqui só avisamos quando a meta é batida. */
function contar(d: DB, s: Student) {
  const meta = metaDe(d, s);
  if (s.aulas + 1 === meta) notify(d, 'prof', `${s.nome} bateu a meta`, `${meta} aulas na faixa ${s.belt.toLowerCase()}. Pronto para graduar.`, 'meta');
  s.aulas += 1; // mostra na hora; o banco confirma
}
export const meuNome = (d: DB) => d.profs.find((p) => p.id === d.session?.sid)?.nome || d.students.find((s) => s.id === d.session?.sid)?.nome || '';
export const nomeProf = (d: DB) => { const n = meuNome(d); return d.session?.role === 'aluno' ? '' : n; };

/* ---------- Presença ---------- */
export function marcarPresenca(sid: string, classId: string, date: string, via: AttVia): Attendance['status'] {
  let result: Attendance['status'] = 'pend';
  update((d) => {
    const s = st(d, sid);
    const a = aulaById(d, classId);
    const ex = d.att.find((x) => x.sid === sid && x.date === date && x.classId === classId);
    if (ex && ex.status !== 'rej') { result = ex.status; return; }
    const auto = (via === 'gps' || via === 'qr') && !d.settings.revisarGps;
    const status = auto ? 'ok' : 'pend';
    const nowTxt = `${br(new Date()).slice(0, 5)} ${hhmm()}`;
    if (ex) { ex.status = 'pend'; ex.via = via; ex.at = hhmm(); ex.sentAt = nowTxt; result = 'pend'; }
    else { d.att.push({ id: uid() + uid(), sid, date, classId, status, via, at: hhmm(), sentAt: nowTxt }); result = status; }
    if (result === 'ok') {
      contar(d, s);
      if (via === 'gps') d.geoChegada[sid] = date;
      notify(d, 'prof', `${primeiro(s.nome)} chegou ${via === 'gps' ? 'por GPS' : 'pelo QR Code'}`, `${a?.nome ?? ''} · presença registrada às ${hhmm()}.`, 'gps');
    } else {
      notify(d, 'prof', `${s.nome} marcou presença`, `${a?.nome ?? ''}, ${date.split('-').reverse().slice(0, 2).join('/')}. Toque para aprovar.`, 'pend');
    }
  });
  return result;
}

export function decidir(attId: string, ok: boolean) {
  update((d) => {
    const x = d.att.find((a) => a.id === attId);
    if (!x || x.status !== 'pend') return;
    x.status = ok ? 'ok' : 'rej';
    const s = st(d, x.sid);
    const a = aulaById(d, x.classId);
    if (ok && s) contar(d, s);
    notify(d, x.sid, ok ? 'Presença aprovada' : 'Presença recusada', `${a?.nome ?? ''} · ${x.date.split('-').reverse().slice(0, 2).join('/')}${ok ? '' : '. Fale com o professor se foi engano.'}`, ok ? 'ok' : 'info');
  });
}
export function aprovarTodas() { update((d) => { d.att.filter((x) => x.status === 'pend').forEach((x) => { x.status = 'ok'; const s = st(d, x.sid); if (s) contar(d, s); notify(d, x.sid, 'Presença aprovada', aulaById(d, x.classId)?.nome ?? '', 'ok'); }); }); }

export function profMarcar(sid: string, classId: string, date = iso(today())) {
  update((d) => {
    const ex = d.att.find((x) => x.sid === sid && x.date === date && x.classId === classId);
    const s = st(d, sid);
    if (ex) {
      if (ex.status === 'ok') { d.att.splice(d.att.indexOf(ex), 1); s.aulas = Math.max(0, s.aulas - 1); return; }
      ex.status = 'ok'; contar(d, s); return;
    }
    d.att.push({ id: uid() + uid(), sid, date, classId, status: 'ok', via: 'prof', at: hhmm() });
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
    st(d, sid).notes.unshift({ d: br(new Date()), t, by: nomeProf(d) || 'Professor' });
    notify(d, sid, 'Nova anotação do professor', t, 'nota');
  });
}
export function graduar(sids: string[]) {
  for (const sid of sids) {
    const s = getDB().students.find((x) => x.id === sid)!;
    if (s.graus < 4) setFaixa(sid, s.belt, s.graus + 1);
    else { const nf = proximaFaixa(s); if (nf) setFaixa(sid, nf, 0); }
    update((d) => { st(d, sid).apto = false; });
  }
}
export const nextStep = (s: Student) => (s.graus < 4 ? `${s.graus + 1}º grau` : `faixa ${(proximaFaixa(s) ?? s.belt).toLowerCase()}`);

/* ---------- Mensalidades ---------- */
export function registrarPagamento(sid: string, valor: number, via: string) {
  update((d) => {
    const s = st(d, sid);
    const mes = iso(today()).slice(0, 7);
    s.pagamentos = [{ mes, valor, data: br(new Date()), via }, ...(s.pagamentos ?? []).filter((p) => p.mes !== mes)];
    s.payInformado = undefined;
    s.mesesEmDia = (s.mesesEmDia ?? 0) + 1;
    notify(d, sid, 'Mensalidade paga', 'Pagamento confirmado pela academia. Oss!', 'pay');
  });
}
export function estornarPagamento(sid: string, mes: string) {
  update((d) => { const s = st(d, sid); s.pagamentos = (s.pagamentos ?? []).filter((p) => p.mes !== mes); s.mesesEmDia = Math.max(0, (s.mesesEmDia ?? 0) - 1); });
}

/* ---------- Avisos e notificações ---------- */
export function lerTodas(to: string) { update((d) => d.notifs.forEach((n) => { if (n.to === to) n.read = true; })); }
export function enviarAviso(para: string, titulo: string, msg: string, grupoDe: (s: Student) => string) {
  update((d) => {
    d.avisos.unshift({ id: uid() + uid(), para, titulo, msg, at: new Date().toISOString() });
    d.students.filter((s) => s.status !== 'inativo' && (para === 'Todos' || grupoDe(s) === para)).forEach((s) => notify(d, s.id, titulo, msg, 'aviso'));
  });
}
export { notify };
