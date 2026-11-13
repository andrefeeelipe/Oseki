import { useState } from 'react';
import { useDB, sair, meuNome, registrarPagamento, decidir, aprovarTodas, profMarcar, setFaixa, setApto, addNote, graduar, nextStep, update, toast, notify } from '../../data/store';
import { PLANOS, planoNome } from '../../data/seed';
import type { BeltName, PlanoId } from '../../data/types';
import { ADULTO, INFANTIL, addDays, aulaById, aulasDoDia, curta, freq, fromIso, grausTxt, grupoDe, idadeDe, iso, metaDe, presencas, today, WD, MES_LONG, br, primeiro, valorDe, brl, mesAtual } from '../../data/util';
import { Avatar, Belt, Chip, Bars, Calendar, Legend, Switch, Stepper, attChip, type DayState, Sheet, Field } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { ProfSub } from '../prof/ProfApp';
import { EditAluno } from '../prof/Alunos';
import { go } from '../../ui/router';
import { rankingDe } from '../shared/Ranking';
import { rosterDe } from '../prof/Chamada';
import { entradasHoje } from '../prof/access';

const MENU: [string, string, string][] = [
  ['painel', 'Painel', 'chart'], ['presencas', 'Presenças do dia', 'clip'], ['aprovacoes', 'Aprovações', 'inbox'], ['alunos', 'Alunos', 'users'],
  ['graduacao', 'Graduação', 'belt'], ['grade', 'Grade de aulas', 'cal'], ['financeiro', 'Financeiro', 'money'], ['ranking', 'Ranking', 'trophy'],
  ['planos', 'Planos e fundador', 'star'], ['contratos', 'Contratos', 'doc'], ['conteudo', 'Conteúdo por plano', 'lock'], ['acesso', 'Controle de acesso', 'door'], ['config', 'Configurações', 'settings'],
];

export default function Desk({ route }: { route: string[] }) {
  const db = useDB();
  // Aceita rotas do app do professor ("prof/x/academia") dentro do painel
  let r = route[0] === 'prof' ? route.slice(1) : route;
  if (r[0] === 'aluno') r = ['ficha', r[1]];
  if (r[0] === 'chamada') r = ['presencas'];
  if (r[0] === 'mais') r = ['painel'];
  const tela = r[0] && r[0] !== 'login' ? r[0] : 'painel';
  const pend = db.att.filter((x) => x.status === 'pend').length;
  const unread = db.notifs.filter((n) => n.to === 'prof' && !n.read).length;
  const eu = db.profs.find((p) => p.id === db.session?.sid);
  const title = tela === 'ficha' ? 'Ficha do aluno' : MENU.find((m) => m[0] === tela)?.[1] ?? 'Painel';
  return (
    <div className="desk os-root">
      <nav className="os-sidenav" aria-label="Menu do painel">
        <div className="nav-hide col" style={{ gap: 2, padding: '0 8px 20px' }}>
          <span style={{ font: 'italic 700 30px/1 var(--font-display)' }}>OSEKI BJJ</span>
          <span className="os-tatame__sub">Painel da academia</span>
        </div>
        {MENU.map(([id, l]) => (
          <button key={id} className="os-navitem" aria-current={tela === id || (tela === 'ficha' && id === 'alunos') ? 'page' : undefined} onClick={() => go(id)}>
            <span>{l}</span>{id === 'aprovacoes' && pend > 0 && <span className="os-count">{pend}</span>}
          </button>
        ))}
        <button className="os-navitem" aria-current={tela === 'x' && r[1] === 'notif' ? 'page' : undefined} onClick={() => go('x/notif')}><span>Notificações</span>{unread > 0 && <span className="os-count">{unread}</span>}</button>
        <div className="nav-hide" style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="os-tatame__sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#5CC48A' }} />Sincronizado com o app</span>
          <div className="row">
            <Avatar s={{ nome: eu?.nome || 'Professor', belt: eu?.belt ?? 'Preta', foto: eu?.foto }} />
            <button className="col grow" style={{ background: 'none', border: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }} onClick={() => go('x/perfil')}><span style={{ fontSize: 13, fontWeight: 700 }}>{meuNome(db) || 'Professor'}</span><span className="os-tatame__sub">{db.session?.role === 'admin' ? 'Administrador' : 'Professor'} · meu perfil</span></button>
            <button className="icon-btn" aria-label="Sair" onClick={() => sair()}><Icon n="logout" size={18} /></button>
          </div>
        </div>
      </nav>
      <main className="desk-main">
        {tela !== 'x' && (
          <div className="row-between wrap">
            <div className="col" style={{ gap: 4 }}>
              <span className="t-sub">{db.settings.academia} / {title}</span>
              <h1 className="desk-title" style={{ margin: 0 }}>{title}</h1>
            </div>
            <div className="row"><Chip tone="info">Mesmos dados do app</Chip><span className="t-small muted">{curta(today())} {today().getFullYear()}</span></div>
          </div>
        )}
        {tela === 'x' && <div style={{ maxWidth: 560, width: '100%', background: 'var(--tatame)', borderRadius: 24, boxShadow: 'var(--shadow-card)', overflow: 'hidden', alignSelf: 'center', position: 'relative' }}><ProfSub sub={r[1]} id={r[2]} /></div>}
        {tela === 'painel' && <DPainel />}
        {tela === 'presencas' && <DPresencas />}
        {tela === 'aprovacoes' && <DAprov />}
        {tela === 'alunos' && <DAlunos />}
        {tela === 'ficha' && <DFicha sid={r[1]} />}
        {tela === 'graduacao' && <DGrad />}
        {tela === 'grade' && <DGrade />}
        {tela === 'financeiro' && <DFin />}
        {tela === 'ranking' && <DRanking />}
        {tela === 'planos' && <DPlanos />}
        {tela === 'contratos' && <DContratos />}
        {tela === 'conteudo' && <DConteudo />}
        {tela === 'acesso' && <DAcesso />}
        {tela === 'config' && <DConfig />}
      </main>
    </div>
  );
}

const Kpi = ({ l, v, sub, tone, onClick }: { l: string; v: React.ReactNode; sub?: string; tone?: 'night' | 'warning'; onClick?: () => void }) => (
  <button className={`os-stat ${tone ? 'os-stat--' + tone : ''}`} style={{ border: 0, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', color: tone === 'night' ? '#fff' : 'var(--ink)', padding: 20 }} onClick={onClick}>
    <span className="os-stat__label">{l}</span><span className="os-stat__value" style={{ fontSize: 44 }}>{v}</span>{sub && <span className="os-stat__label">{sub}</span>}
  </button>
);

function DPainel() {
  const db = useDB();
  const hoje = iso(today());
  const recs = db.att.filter((x) => x.date === hoje && x.status === 'ok');
  const media = Math.round(db.students.reduce((a, s) => a + freq(db, s), 0) / db.students.length);
  const pend = db.att.filter((x) => x.status === 'pend').length;
  const ini = addDays(today(), -today().getDay());
  const semana = Array.from({ length: 7 }, (_, i) => { const d = addDays(ini, i); return { l: `${WD[i]} ${d.getDate()}`, v: db.att.filter((x) => x.date === iso(d) && x.status === 'ok').length }; });
  const prontos = db.students.filter((s) => s.apto || s.aulas >= metaDe(db, s));
  const atencao = db.students.map((s) => { const u = presencas(db, s.id).map((x) => x.date).sort().pop(); return { s, dias: u ? Math.round((today().getTime() - fromIso(u).getTime()) / 864e5) : 99, f: freq(db, s) }; }).filter((x) => x.dias >= 7 || x.f < 65).slice(0, 4);
  return (
    <>
      <div className="kpis">
        <Kpi l="Alunos ativos" v={db.students.filter((s) => s.status !== 'inativo').length} sub={`${db.students.filter((s) => s.pay === 'atraso').length} com mensalidade atrasada`} tone="night" />
        <Kpi l="Presentes hoje" v={new Set(recs.map((x) => x.sid)).size} sub={`${recs.filter((x) => x.via === 'gps').length} por GPS`} onClick={() => go('presencas')} />
        <Kpi l="Frequência média" v={`${media}%`} sub="últimos 30 dias" />
        <Kpi l="Aprovações pendentes" v={pend} sub="Revisar agora" tone={pend ? 'warning' : undefined} onClick={() => go('aprovacoes')} />
      </div>
      <div className="desk-grid">
        <div className="os-card os-card--desk"><div className="row-between"><span className="t-title">Presenças por dia</span><span className="t-sub">semana atual</span></div><Bars data={semana} hl={today().getDay()} /></div>
        <div className="os-card os-card--desk">
          <span className="t-title">Aulas de hoje</span>
          {aulasDoDia(db, today()).map((a) => <div key={a.id} className="kv"><span>{a.ini} · {a.nome}</span><span>{new Set(recs.filter((x) => x.classId === a.id).map((x) => x.sid)).size} presentes · {a.prof}</span></div>)}
          {aulasDoDia(db, today()).length === 0 && <span className="t-small muted">Sem aulas hoje.</span>}
        </div>
        <div className="os-card os-card--desk">
          <span className="t-title">Precisam de atenção</span>
          {atencao.map(({ s, dias, f }) => <div key={s.id} className="row"><Avatar s={s} /><div className="grow col"><span className="t-strong" style={{ fontSize: 14 }}>{s.nome}</span><span className="t-sub">{dias >= 7 ? `${dias} dias sem treinar` : `frequência caiu para ${f}%`}{s.pay === 'atraso' ? ' · mensalidade em atraso' : ''}</span></div><button className="os-btn os-btn--quiet os-btn--sm" onClick={() => go(`ficha/${s.id}`)}>Ficha</button></div>)}
        </div>
        <div className="os-card os-card--desk">
          <div className="row-between"><span className="t-title">Prontos para graduar</span><button className="link" onClick={() => go('graduacao')}>Ver graduação</button></div>
          {prontos.map((s) => <div key={s.id} className="row"><Avatar s={s} size={34} /><span className="grow t-small t-strong">{s.nome}</span><span className="t-sub num">{s.aulas}/{metaDe(db, s)} aulas</span></div>)}
          {prontos.length === 0 && <span className="t-small muted">Ninguém ainda.</span>}
        </div>
      </div>
    </>
  );
}

function DPresencas() {
  const db = useDB();
  const [dia, setDia] = useState(iso(today()));
  const aulas = aulasDoDia(db, fromIso(dia));
  const [sel, setSel] = useState<string | null>(null);
  const aula = aulas.find((a) => a.id === sel) ?? aulas[0];
  const recs = db.att.filter((x) => x.date === dia);
  const roster = aula ? rosterDe(db, aula) : [];
  return (
    <>
      <div className="row wrap"><input type="date" className="os-input" value={dia} max={iso(today())} onChange={(e) => { setDia(e.target.value); setSel(null); }} />
        {aulas.map((a) => <button key={a.id} className="os-pill" aria-pressed={a.id === aula?.id} onClick={() => setSel(a.id)}>{a.ini} · {a.nome} · {new Set(recs.filter((x) => x.classId === a.id && x.status === 'ok').map((x) => x.sid)).size}</button>)}
        {aula && <button className="os-btn os-btn--secondary os-btn--desk" onClick={() => go(`x/qr/${aula.id}`)}><Icon n="qr" size={18} />Exibir QR da aula</button>}</div>
      {!aula ? <div className="empty"><span className="t-small muted">Sem aulas neste dia.</span></div> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Aluno</th><th>Faixa</th><th>Status</th><th>Origem</th><th>Horário</th><th>Ação</th></tr></thead>
          <tbody>{roster.map((s) => { const r = recs.find((x) => x.sid === s.id && x.classId === aula.id) ?? null; const c = attChip(r); return (
            <tr key={s.id}><td><div className="row"><Avatar s={s} size={34} /><button className="link" style={{ color: 'var(--ink)' }} onClick={() => go(`ficha/${s.id}`)}>{s.nome}</button></div></td>
              <td><div style={{ width: 60 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></div></td>
              <td><Chip tone={r ? c.tone : 'neutral'}>{r ? c.t : 'Ausente'}</Chip></td>
              <td className="t-small muted">{r ? { gps: 'GPS', qr: 'QR Code', app: 'App', prof: 'Professor' }[r.via] : '—'}</td><td className="num">{r?.at ?? '—'}</td>
              <td>{r?.status === 'pend' ? <button className="os-btn os-btn--primary os-btn--sm" onClick={() => decidir(r.id, true)}>Aprovar</button> : <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => profMarcar(s.id, aula.id, dia)}>{r?.status === 'ok' ? 'Desfazer' : 'Marcar presente'}</button>}</td></tr>); })}</tbody>
        </table></div>
      )}
    </>
  );
}

function DAprov() {
  const db = useDB();
  const reqs = db.att.filter((x) => x.status === 'pend');
  return (
    <>
      <div className="row-between"><span className="t-small muted">Presenças marcadas pelos alunos no app. Aprovar aqui atualiza o app na hora.</span>{reqs.length > 0 && <button className="os-btn os-btn--primary os-btn--desk" onClick={() => { aprovarTodas(); toast(`${reqs.length} presenças aprovadas.`); }}>Aprovar todas ({reqs.length})</button>}</div>
      {reqs.length === 0 ? <div className="empty"><Icon n="checkCircle" size={36} style={{ color: 'var(--success)' }} /><span className="t-strong">Tudo em dia. Oss!</span><span className="t-small muted">Nenhuma presença aguardando aprovação.</span></div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Aula</th><th>Data</th><th>Enviado</th><th>Ações</th></tr></thead>
          <tbody>{reqs.map((q) => { const s = db.students.find((x) => x.id === q.sid)!; const a = aulaById(db, q.classId); return (
            <tr key={q.id}><td><div className="row"><Avatar s={s} size={34} />{s.nome}</div></td><td>{a?.nome} · {a?.ini}</td><td>{curta(fromIso(q.date))}</td><td className="t-sub">{q.sentAt ?? '—'}</td>
              <td><div className="row" style={{ gap: 8 }}><button className="os-btn os-btn--danger os-btn--sm" onClick={() => decidir(q.id, false)}>Recusar</button><button className="os-btn os-btn--primary os-btn--sm" onClick={() => decidir(q.id, true)}>Aprovar</button></div></td></tr>); })}</tbody></table></div>
      )}
    </>
  );
}

const payChip = (p: string, dias?: number) => p === 'pago' ? <Chip tone="success">Em dia</Chip> : p === 'atraso' ? <Chip tone="danger">Atrasada · {dias}d</Chip> : p === 'analise' ? <Chip tone="info">Em análise</Chip> : <Chip tone="warning">Em aberto</Chip>;

function DAlunos() {
  const db = useDB();
  const [q, setQ] = useState('');
  const [g, setG] = useState('Todos');
  const lista = db.students.filter((s) => s.nome.toLowerCase().includes(q.toLowerCase()) && (g === 'Inativos' ? s.status === 'inativo' : s.status !== 'inativo' && (g === 'Todos' || grupoDe(s) === g))).sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <>
      <div className="row wrap"><input className="os-input" style={{ minWidth: 260, background: 'var(--surface)' }} placeholder="Buscar aluno" value={q} onChange={(e) => setQ(e.target.value)} />
        {['Todos', 'Kids', 'Teens', 'Adulto', 'Inativos'].map((x) => <button key={x} className="os-pill" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
        <span className="grow" /><button className="os-btn os-btn--primary os-btn--desk" onClick={() => go('x/convidar')}><Icon n="plus" size={18} />Convidar aluno</button></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Faixa</th><th>Turma</th><th>Frequência</th><th>Aulas na faixa</th><th>Mensalidade</th><th></th></tr></thead>
        <tbody>{lista.map((s) => (
          <tr key={s.id}><td><div className="row"><Avatar s={s} size={34} /><div className="col"><span className="t-strong">{s.nome}</span><span className="t-sub">{s.nasc ? `${idadeDe(s.nasc)} anos` : 'convidado'}</span></div></div></td>
            <td><div className="col" style={{ gap: 4 }}><div style={{ width: 64 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></div><span className="t-sub">{s.belt} · {grausTxt(s.graus)}</span></div></td>
            <td className="t-small">{aulaById(db, s.turma)?.nome}</td><td className="num t-strong">{freq(db, s)}%</td><td className="num">{s.aulas}/{metaDe(db, s)}</td><td><div className="col" style={{ gap: 2 }}>{payChip(s.pay, s.payDias)}<span className="t-sub">{brl(valorDe(db, s))}</span></div></td>
            <td><button className="os-btn os-btn--quiet os-btn--sm" onClick={() => go(`ficha/${s.id}`)}>Abrir ficha</button></td></tr>))}</tbody></table></div>
    </>
  );
}

function DFicha({ sid }: { sid?: string }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid);
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState(false);
  const [pg, setPg] = useState<null | { valor: string; via: string }>(null);
  const [month] = useState(new Date(today().getFullYear(), today().getMonth(), 1));
  if (!s) return <span>Aluno não encontrado.</span>;
  const a = aulaById(db, s.turma);
  const recs = db.att.filter((x) => x.sid === s.id);
  const meta = metaDe(db, s);
  const stateOf = (d: string): DayState => { const r = recs.filter((x) => x.date === d); if (r.some((x) => x.status === 'ok')) return 'presente'; if (r.some((x) => x.status === 'pend')) return 'pendente'; if (r.some((x) => x.status === 'rej')) return 'falta'; const dt = fromIso(d); return dt < today() && a?.dias.includes(dt.getDay()) ? 'falta' : null; };
  const doMes = recs.filter((x) => x.date.startsWith(iso(month).slice(0, 7)) && x.status === 'ok');
  const opts: BeltName[] = grupoDe(s) === 'Adulto' ? ADULTO : Array.from(new Set([...INFANTIL, ...ADULTO]));
  return (
    <>
      <div className="row"><Avatar s={s} size={72} /><div className="col grow"><span className="t-display-md">{s.nome}</span><span className="t-small muted">{a?.nome} · {idadeDe(s.nasc)} anos {s.fundador ? `· fundador #${s.fundador}` : ''}</span></div><button className="os-btn os-btn--secondary os-btn--desk" onClick={() => setEdit(true)}>Editar dados</button></div>
      <div className="desk-grid">
        <div className="os-card os-card--desk">
          <span className="t-title">Graduação</span>
          <Belt belt={s.belt} graus={s.graus} size="lg" />
          <span className="os-overline">Faixa</span>
          <div className="row wrap">{opts.map((b) => <button key={b} className="os-pill" aria-pressed={s.belt === b} onClick={() => setFaixa(s.id, b, 0)}><span style={{ width: 24, marginRight: 6 }}><Belt belt={b} graus={0} size="sm" /></span>{b}</button>)}</div>
          <span className="os-overline">Graus</span>
          <div className="row">{[0, 1, 2, 3, 4].map((n) => <button key={n} className="os-pill" style={{ width: 48, justifyContent: 'center' }} aria-pressed={s.graus === n} onClick={() => setFaixa(s.id, s.belt, n)}>{n}</button>)}</div>
          <div className="setting"><div className="col"><span className="t-strong" style={{ fontSize: 14 }}>Apto para exame</span><span className="t-sub">Aparece no app do aluno</span></div><Switch on={s.apto} onChange={(v) => setApto(s.id, v)} label="Apto para exame" /></div>
          <div className="kv"><span>Telefone</span><span>{s.tel || '—'}</span></div>
          <div className="kv"><span>Responsável</span><span>{s.resp || '—'}</span></div>
          <div className="kv"><span>E-mail</span><span>{s.email || '—'}</span></div>
          <div className="kv"><span>Plano</span><span>{planoNome(s.plano)} · {brl(valorDe(db, s))}</span></div>
          <div className="kv"><span>Mensalidade</span><span>{payChip(s.pay, s.payDias)}</span></div>
          {s.pay !== 'pago' && <button className="os-btn os-btn--primary os-btn--desk" onClick={() => setPg({ valor: String(valorDe(db, s) || ''), via: 'Pix' })}>Registrar pagamento do mês</button>}
          {(s.pagamentos ?? []).slice(0, 6).map((p) => <div key={p.mes} className="kv" style={{ fontSize: 13, padding: '8px 0' }}><span>{p.mes.split('-').reverse().join('/')} · {p.via}</span><span>{brl(p.valor)}</span></div>)}
        </div>
        <div className="os-card os-card--desk">
          <div className="row-between"><span className="t-title">Presença · {MES_LONG[month.getMonth()].toLowerCase()}</span><span className="t-sub num">{s.aulas}/{meta} aulas na faixa</span></div>
          <Calendar month={month} stateOf={stateOf} gpsOf={(d) => recs.some((x) => x.date === d && x.via === 'gps' && x.status === 'ok')} compact />
          <Legend />
          <div className="grid-3">
            <div className="os-stat" style={{ background: 'var(--surface-sunken)' }}><span className="os-stat__value">{freq(db, s)}%</span><span className="os-stat__label">frequência</span></div>
            <div className="os-stat" style={{ background: 'var(--surface-sunken)' }}><span className="os-stat__value">{doMes.filter((x) => x.via === 'gps').length}</span><span className="os-stat__label">via GPS</span></div>
            <div className="os-stat" style={{ background: 'var(--surface-sunken)' }}><span className="os-stat__value">{doMes.filter((x) => x.via === 'app').length}</span><span className="os-stat__label">pelo app</span></div>
          </div>
        </div>
        <div className="os-card os-card--desk">
          <span className="t-title">Anotações do professor</span>
          <textarea className="textarea" placeholder="Ex.: refinar a passagem de meia-guarda" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="os-btn os-btn--primary os-btn--desk" disabled={!note.trim()} onClick={() => { addNote(s.id, note.trim()); setNote(''); toast('Anotação enviada ao app do aluno.'); }}>Salvar e enviar ao app do aluno</button>
          {s.notes.length === 0 && <span className="t-small muted">Nenhuma anotação ainda.</span>}
          {s.notes.map((n, i) => <div key={i} className="divider col" style={{ paddingTop: 10 }}><span className="t-sub">{n.d}</span><span className="t-body">{n.t}</span></div>)}
        </div>
      </div>
      {edit && <EditAluno sid={s.id} onClose={() => setEdit(false)} />}
      {pg && (
        <Sheet title="Registrar pagamento" onClose={() => setPg(null)}>
          <Field label="Valor (R$)"><input className="os-input" inputMode="decimal" value={pg.valor} onChange={(e) => setPg({ ...pg, valor: e.target.value })} /></Field>
          <div className="row wrap">{['Pix', 'Dinheiro', 'Cartão', 'Transferência'].map((v) => <button key={v} className="os-pill" aria-pressed={pg.via === v} onClick={() => setPg({ ...pg, via: v })}>{v}</button>)}</div>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => { registrarPagamento(s.id, Number(pg.valor.replace(',', '.')) || 0, pg.via); setPg(null); toast('Pagamento registrado.'); }}>Confirmar pagamento</button>
        </Sheet>
      )}
    </>
  );
}

function DGrad() {
  const db = useDB();
  const cands = db.students.filter((s) => s.apto || s.aulas >= metaDe(db, s) - 3);
  const [sel, setSel] = useState<string[]>(cands.filter((s) => s.apto).map((s) => s.id));
  return (
    <>
      <div className="row-between"><span className="t-small muted">Selecione e confirme. A nova faixa aparece no app de cada aluno na hora.</span>
        <button className="os-btn os-btn--primary os-btn--desk" disabled={!sel.length} onClick={() => { graduar(sel); toast(`${sel.length} graduados. Oss!`); setSel([]); }}>{sel.length ? `Graduar ${sel.length} ${sel.length === 1 ? 'aluno' : 'alunos'}` : 'Selecione os alunos'}</button></div>
      <div className="desk-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {cands.map((s) => { const on = sel.includes(s.id); return (
          <button key={s.id} className="os-card os-card--desk" aria-pressed={on} onClick={() => setSel(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])} style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', border: `2px solid ${on ? 'var(--brand-ink)' : 'transparent'}` }}>
            <div className="row"><Avatar s={s} /><div className="grow col"><span className="t-strong">{s.nome}</span><span className="t-sub">→ {nextStep(s)}</span></div>{s.apto && <Chip tone="success">Apto</Chip>}</div>
            <Belt belt={s.belt} graus={s.graus} />
            <span className="t-sub num">{s.aulas}/{metaDe(db, s)} aulas</span>
          </button>); })}
      </div>
    </>
  );
}

function DGrade() {
  const db = useDB();
  const ini = addDays(today(), -today().getDay());
  return (
    <>
      <div className="row-between"><span className="t-small muted">Toque numa aula para editar.</span><button className="os-btn os-btn--primary os-btn--desk" onClick={() => go('x/novaaula')}><Icon n="plus" size={18} />Nova aula</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: 10, overflowX: 'auto' }}>
        {WD.map((w, i) => { const d = addDays(ini, i); return (
          <div key={w} className="col-2">
            <span className="os-overline" style={{ color: iso(d) === iso(today()) ? 'var(--ponteira)' : undefined }}>{w} · {d.getDate()}</span>
            {aulasDoDia(db, d).map((a) => <button key={a.id} className="os-card os-card--flat" style={{ padding: 12, borderRadius: 12, textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', gap: 2, border: 0 }} onClick={() => go(`x/novaaula/${a.id}`)}><span className="t-strong" style={{ fontSize: 13 }}>{a.ini}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{a.nome}</span><span className="t-sub" style={{ fontSize: 11 }}>{a.prof}</span></button>)}
          </div>); })}
      </div>
    </>
  );
}

function DFin() {
  const db = useDB();
  const [pg, setPg] = useState<null | { sid: string; valor: string; via: string }>(null);
  const ativos = db.students.filter((s) => s.status !== 'inativo');
  const m = mesAtual();
  const pagas = ativos.filter((s) => s.pay === 'pago').length;
  const atraso = ativos.filter((s) => s.pay === 'atraso').length;
  const recebido = ativos.reduce((t, s) => t + (s.pagamentos ?? []).filter((p) => p.mes === m).reduce((a, p) => a + p.valor, 0), 0);
  const previsto = ativos.reduce((t, s) => t + valorDe(db, s), 0);
  const real = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <>
      <div className="kpis"><Kpi l={`Recebido em ${MES_LONG[today().getMonth()].toLowerCase()}`} v={real(recebido)} sub={`previsto ${real(previsto)}`} tone="night" /><Kpi l="Pagas" v={pagas} /><Kpi l="Em aberto" v={ativos.length - pagas - atraso} /><Kpi l="Em atraso" v={atraso} tone={atraso ? 'warning' : undefined} /></div>
      {PLANOS.some((p) => !db.settings.precos?.[p.id]) && <button className="os-btn os-btn--secondary os-btn--desk" style={{ alignSelf: 'flex-start' }} onClick={() => go('x/academia')}>Definir valores dos planos</button>}
      <div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Plano</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>{ativos.map((s) => (
          <tr key={s.id}><td><div className="row"><Avatar s={s} size={34} />{s.nome}{s.fundador && <span className="os-seal os-seal--fundador">Fundador</span>}</div></td><td>{planoNome(s.plano)}</td><td className="num t-strong">{brl(valorDe(db, s))}</td><td>dia {db.settings.vencimento || 15}</td><td>{payChip(s.pay, s.payDias)}</td>
            <td>{s.pay === 'pago' ? <span className="t-sub">{(s.pagamentos ?? []).find((p) => p.mes === m)?.via}</span> : <div className="row" style={{ gap: 6 }}>{s.pay !== 'analise' && <button className="os-btn os-btn--secondary os-btn--sm" onClick={() => { update((d) => notify(d, s.id, 'Lembrete de mensalidade', 'Sua mensalidade está em aberto. Pague pelo app com Pix.', 'pay')); toast('Lembrete enviado.'); }}>Cobrar</button>}<button className="os-btn os-btn--primary os-btn--sm" onClick={() => setPg({ sid: s.id, valor: String(valorDe(db, s) || ''), via: s.pay === 'analise' ? 'Pix' : 'Dinheiro' })}>{s.pay === 'analise' ? 'Confirmar Pix' : 'Registrar pagamento'}</button></div>}</td></tr>))}</tbody></table></div>
      {pg && (
        <Sheet title="Registrar pagamento" onClose={() => setPg(null)}>
          <Field label="Valor (R$)"><input className="os-input" inputMode="decimal" value={pg.valor} onChange={(e) => setPg({ ...pg, valor: e.target.value })} /></Field>
          <div className="row wrap">{['Pix', 'Dinheiro', 'Cartão', 'Transferência'].map((v) => <button key={v} className="os-pill" aria-pressed={pg.via === v} onClick={() => setPg({ ...pg, via: v })}>{v}</button>)}</div>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => { registrarPagamento(pg.sid, Number(pg.valor.replace(',', '.')) || 0, pg.via); setPg(null); toast('Pagamento registrado.'); }}>Confirmar pagamento</button>
        </Sheet>
      )}
    </>
  );
}

function DRanking() {
  const db = useDB();
  const [per, setPer] = useState(1);
  const [g, setG] = useState('Todos');
  const list = rankingDe(db, per, g);
  return (
    <>
      <div className="row wrap"><div className="seg" style={{ width: 280 }}>{['Semana', 'Mês', 'Ano'].map((l, i) => <button key={l} aria-pressed={per === i} onClick={() => setPer(i)}>{l}</button>)}</div>
        {['Todos', 'Kids', 'Teens', 'Adulto'].map((x) => <button key={x} className="os-pill" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
        <span className="grow" /><button className="os-btn os-btn--primary os-btn--desk" onClick={() => { update((d) => { d.settings.rankingPublicado = true; }); toast('Ranking publicado no app dos alunos.'); }}>{db.settings.rankingPublicado ? 'Publicado no app' : 'Divulgar no app'}</button></div>
      <div className="kpis">{list.slice(0, 3).map((r, i) => <div key={r.s.id} className={`os-stat ${i === 0 ? 'os-stat--night' : ''}`} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}><span className="os-stat__value" style={{ fontSize: 44, color: i === 0 ? 'var(--fundador)' : undefined }}>{i + 1}º</span><Avatar s={r.s} /><div className="col grow"><span className="t-strong">{r.s.nome}</span><span className="os-stat__label">{r.s.belt}</span></div><span className="os-stat__value">{r.v}</span></div>)}</div>
      <div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Aluno</th><th>Faixa</th><th>Turma</th><th>Sequência</th><th>Presenças</th></tr></thead>
        <tbody>{list.map((r, i) => <tr key={r.s.id}><td className="t-strong">{i + 1}</td><td><div className="row"><Avatar s={r.s} size={34} />{r.s.nome}{r.s.fundador && <span className="os-seal os-seal--fundador">Fundador</span>}</div></td><td><div style={{ width: 60 }}><Belt belt={r.s.belt} graus={r.s.graus} size="sm" /></div></td><td className="t-small">{aulaById(db, r.s.turma)?.nome}</td><td className="t-small">{r.seq} semanas</td><td className="num t-strong">{r.v}</td></tr>)}</tbody></table></div>
    </>
  );
}

function DPlanos() {
  const db = useDB();
  const s = db.settings;
  const funds = db.students.filter((x) => x.fundador).sort((a, b) => a.fundador! - b.fundador!);
  const setS = (k: 'fundadorVagas' | 'fundadorDesconto' | 'fundadorTolerancia', v: number) => update((d) => { d.settings[k] = v; });
  return (
    <>
      <button className="os-btn os-btn--secondary os-btn--desk" style={{ alignSelf: 'flex-start' }} onClick={() => go('x/academia')}>Editar valores, vencimento e Pix</button>
      <div className="kpis">{PLANOS.map((p) => <div key={p.id} className="os-card os-card--desk" style={{ gap: 6 }}><div className="row-between"><span className="t-display-sm" style={{ fontSize: 22 }}>{p.nome}</span>{p.id !== 'avulso' && <span className="os-seal os-seal--fundador">Fundador</span>}</div><span className="t-stat" style={{ fontSize: 26 }}>{brl(s.precos?.[p.id] ?? 0)}</span><span className="t-sub">{p.per} · {p.desc}</span><span className="t-small">Alunos ativos: <b>{db.students.filter((x) => x.plano === p.id).length}</b></span></div>)}</div>
      <div className="desk-grid">
        <div className="os-card os-card--desk os-card--night">
          <span className="os-overline" style={{ color: 'var(--fundador)' }}>Programa aluno fundador</span>
          <span className="t-stat" style={{ fontSize: 56 }}>{funds.length}<span style={{ fontSize: 24 }} className="on-night-muted">/{s.fundadorVagas}</span></span>
          <div className="os-bar" style={{ background: 'rgba(255,255,255,0.15)' }}><div className="os-bar__fill os-bar__fill--fundador" style={{ width: `${(funds.length / s.fundadorVagas) * 100}%` }} /></div>
          <span className="os-muted t-small">{s.fundadorVagas - funds.length} vagas restantes · os {s.fundadorVagas} primeiros a fechar plano (exceto avulso)</span>
          {([['Vagas', 'fundadorVagas'], ['Desconto (%)', 'fundadorDesconto'], ['Tolerância de atraso (dias)', 'fundadorTolerancia']] as const).map(([l, k]) => <div key={k} className="row-between"><span>{l}</span><div style={{ color: 'var(--ink)' }}><Stepper v={s[k]} set={(v) => setS(k, v)} min={0} label={l} /></div></div>)}
          <span className="os-muted t-sub">Mantém {s.fundadorDesconto}% enquanto pagar em dia. Atraso acima de {s.fundadorTolerancia} dias perde o título.</span>
        </div>
        <div className="table-wrap" style={{ padding: 12 }}><table className="table"><thead><tr><th>Nº</th><th>Aluno</th><th>Plano</th><th>Meses em dia</th><th>Desconto</th></tr></thead>
          <tbody>{funds.map((f) => <tr key={f.id}><td className="t-strong">#{f.fundador}</td><td>{f.nome}</td><td>{planoNome(f.plano)}</td><td className="num">{f.mesesEmDia}</td><td>{f.pay === 'atraso' && (f.payDias ?? 0) > s.fundadorTolerancia ? <Chip tone="danger">Em risco</Chip> : <Chip tone="success">{s.fundadorDesconto}% ativo</Chip>}</td></tr>)}</tbody></table></div>
      </div>
    </>
  );
}

function DContratos() {
  const db = useDB();
  const [fil, setFil] = useState('');
  const ST = { ativo: ['Ativo', 'success'], vence: ['Vence logo', 'warning'], vencido: ['Vencido', 'danger'], assin: ['Sem assinatura', 'info'] } as const;
  const AC: Record<string, string> = { vence: 'Renovar', vencido: 'Enviar renovação', assin: 'Reenviar para assinar' };
  return (
    <>
      <div className="kpis">{(['ativo', 'vence', 'vencido', 'assin'] as const).map((k) => <Kpi key={k} l={ST[k][0]} v={db.students.filter((s) => s.contrato.status === k).length} tone={fil === k ? 'night' : undefined} onClick={() => setFil(fil === k ? '' : k)} />)}</div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Aluno</th><th>Plano</th><th>Vigência</th><th>Renovação</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>{db.students.filter((s) => !fil || s.contrato.status === fil).map((s) => (
          <tr key={s.id}><td><div className="row">{s.nome}{s.fundador && <span className="os-seal os-seal--fundador">Fundador #{s.fundador}</span>}</div></td><td>{planoNome(s.plano)}</td><td className="t-small">{s.contrato.vig}</td><td className="t-small">{s.contrato.renova ? 'Automática' : 'Manual'}</td><td><Chip tone={ST[s.contrato.status][1]}>{ST[s.contrato.status][0]}</Chip></td>
            <td><div className="row" style={{ gap: 6 }}><button className="os-btn os-btn--quiet os-btn--sm" onClick={() => window.print()}>PDF</button>{AC[s.contrato.status] && <button className="os-btn os-btn--primary os-btn--sm" onClick={() => { update((d) => { const x = d.students.find((y) => y.id === s.id)!; if (x.contrato.status === 'vence') { x.contrato.status = 'ativo'; x.contrato.vig = `até ${br(addDays(today(), 90))}`; } notify(d, s.id, 'Contrato', 'A academia enviou seu contrato. Abra Meu plano.', 'info'); }); toast('Feito.'); }}>{AC[s.contrato.status]}</button>}</div></td></tr>))}</tbody></table></div>
    </>
  );
}

function DConteudo() {
  const db = useDB();
  const c = db.settings.conteudo;
  return (
    <>
      <span className="t-small muted">Defina o que cada plano libera no app. Conteúdo bloqueado aparece com cadeado e convite para mudar de plano.</span>
      <div className="table-wrap"><table className="table"><thead><tr><th>Conteúdo</th>{PLANOS.map((p) => <th key={p.id}>{p.nome}</th>)}</tr></thead>
        <tbody>{Object.keys(c).map((k) => <tr key={k}><td className="t-strong">{k}</td>{PLANOS.map((p) => <td key={p.id}><Switch on={c[k][p.id]} label={`${k} no plano ${p.nome}`} onChange={(v) => update((d) => { d.settings.conteudo[k][p.id as PlanoId] = v; })} /></td>)}</tr>)}</tbody></table></div>
    </>
  );
}

function DAcesso() {
  const db = useDB();
  const es = entradasHoje(db);
  const bloq = es.filter((e) => e.bloq && !e.liberado).length;
  const [regras, setRegras] = useState({ atraso: true, contrato: true, avulso: true, visitante: false });
  return (
    <>
      <div className="kpis"><Kpi l="No tatame agora" v={es.length - bloq} tone="night" /><Kpi l="Entradas hoje" v={es.length} /><Kpi l="Bloqueadas hoje" v={bloq} tone={bloq ? 'warning' : undefined} /></div>
      <div className="desk-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="table-wrap"><table className="table"><thead><tr><th>Hora</th><th>Aluno</th><th>Meio</th><th>Resultado</th><th></th></tr></thead>
          <tbody>{es.map((e) => { const b = e.bloq && !e.liberado; return (
            <tr key={e.id} className={b ? 'blocked' : ''}><td className="num t-strong">{e.h}</td><td>{e.nome}</td><td className="t-small">{e.meio}</td><td><div className="col"><Chip tone={b ? 'danger' : 'success'}>{b ? 'Bloqueado' : 'Liberado'}</Chip><span className="t-sub">{e.liberado ? 'Liberado manualmente' : e.motivo}</span></div></td>
              <td>{b && <button className="os-btn os-btn--primary os-btn--sm" onClick={() => { update((d) => { d.access.push({ id: e.id, h: '', nome: e.nome, meio: '', motivo: '', bloq: true, liberado: true }); }); toast(`Entrada de ${primeiro(e.nome)} liberada.`); }}>Liberar</button>}</td></tr>); })}</tbody></table></div>
        <div className="os-card os-card--desk">
          <span className="t-title">Regras de acesso</span>
          {([['atraso', 'Bloquear mensalidade atrasada', 'Acima da tolerância do programa fundador'], ['contrato', 'Bloquear contrato sem assinatura', 'Libera depois da assinatura no app'], ['avulso', 'Avulso só com aula paga', 'Pacote ou aula única'], ['visitante', 'Visitante sem cadastro', 'Libera pela recepção']] as const).map(([k, t, d]) => (
            <div key={k} className="setting"><div className="col"><span className="t-strong" style={{ fontSize: 14 }}>{t}</span><span className="t-sub">{d}</span></div><Switch on={regras[k]} label={t} onChange={(v) => setRegras({ ...regras, [k]: v })} /></div>
          ))}
        </div>
      </div>
    </>
  );
}

function DConfig() {
  const db = useDB();
  const s = db.settings;
  return (
    <div className="desk-grid">
      <div className="os-card os-card--desk">
        <span className="t-title">Área de presença automática</span>
        <div className="seg">{[50, 100, 200, 300].map((r) => <button key={r} aria-pressed={s.raio === r} onClick={() => update((d) => { d.settings.raio = r; })}>{r} m</button>)}</div>
        <span className="t-sub">Janela: 30 min antes até 15 min após o início da aula.</span>
        <span className="t-mono" style={{ fontSize: 12 }}>{s.lat != null ? `${s.lat.toFixed(5)}, ${s.lng!.toFixed(5)}` : 'Local ainda não definido'}</span>
        <button className="os-btn os-btn--secondary os-btn--desk" onClick={() => go('x/geo')}>Definir local pelo celular</button>
      </div>
      <div className="os-card os-card--desk">
        <span className="t-title">Quem acessa o painel desktop</span>
        {db.profs.map((p) => <div key={p.id} className="row"><Avatar s={{ nome: p.nome || 'Professor', belt: p.belt, foto: p.foto }} /><span className="grow t-strong">{p.nome || 'Sem nome'}</span><Chip tone="info">{p.role === 'admin' ? 'Admin' : 'Professor'}</Chip></div>)}
        <div className="row"><div className="os-avatar" style={{ background: 'var(--surface-sunken)', color: 'var(--ink)' }}>{db.students.filter((s) => s.status !== 'inativo').length}</div><span className="grow t-strong">Alunos</span><Chip tone="neutral">Só o app</Chip></div>
        <button className="os-btn os-btn--secondary os-btn--desk" onClick={() => go('x/academia')}>Dados da academia, valores, Pix e códigos</button>
      </div>
      <div className="os-card os-card--desk">
        <span className="t-title">Formas de check-in no app</span>
        {([['gps', 'GPS automático', 'Presença ao chegar no raio'], ['qr', 'QR Code da aula', 'Código muda a cada 30 s'], ['app', 'Marcação manual', 'Vai para aprovação do professor']] as const).map(([k, t, d]) => (
          <div key={k} className="setting"><div className="col"><span className="t-strong" style={{ fontSize: 14 }}>{t}</span><span className="t-sub">{d}</span></div><Switch on={s.metodos[k]} label={t} onChange={(v) => update((x) => { x.settings.metodos[k] = v; })} /></div>
        ))}
        <div className="setting"><div className="col"><span className="t-strong" style={{ fontSize: 14 }}>Revisar presenças por GPS</span><span className="t-sub">GPS também vai para aprovação</span></div><Switch on={s.revisarGps} label="Revisar presenças por GPS" onChange={(v) => update((x) => { x.settings.revisarGps = v; })} /></div>
      </div>
    </div>
  );
}
