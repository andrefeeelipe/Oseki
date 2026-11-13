import { TrocarSenha } from '../../ui/TrocarSenha';
import { useRef, useState } from 'react';
import { useDB, update, toast, notify, novoAluno, registrarPagamento, sair, trocarSenha } from '../../data/store';
import { fileToAvatar } from '../../ui/photo';
import { PLANOS, planoNome } from '../../data/seed';
import type { BeltName, TecnicaNivel } from '../../data/types';
import { ADULTO, INFANTIL, MES, addDays, aulaById, freq, freqMes, grupoDe, iso, presencas, today, uid, iniciais, br, MES_LONG, valorDe, brl, mesAtual } from '../../data/util';
import { Sub, Avatar, Bars, Chip, Overline, Setting, Field, Stepper, Calendar, Legend, type DayState, LinkCard, Sheet } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { entradasHoje } from './access';
import { passoExame } from '../shared/exame';
import { treinosDaSemana } from '../../data/cronograma';
import { WD_LONG } from '../../data/util';
import { chaveTec, sortear } from '../../data/curriculo';
import { graduar } from '../../data/store';

/* N6 · Plano de aula */
export function PlanoAula() {
  const db = useDB();
  const p = db.settings.planoAula;
  const [tec, setTec] = useState(p.tecnica);
  const done = p.passos.filter((x) => x.done).length;
  const semana = treinosDaSemana(today());
  const tog = (i: number) => update((d) => { d.settings.planoAula.passos[i].done = !d.settings.planoAula.passos[i].done; });
  const salvarTec = () => update((d) => {
    d.settings.planoAula.tecnica = tec;
    d.tecnicas.forEach((t) => { t.semana = false; });
    const ex = d.tecnicas.find((t) => t.titulo.toLowerCase() === tec.toLowerCase());
    if (ex) ex.semana = true; else d.tecnicas.unshift({ id: uid(), titulo: tec, cat: 'Aula', faixaMin: 'Branca', dur: '', desc: 'Técnica do dia definida no plano de aula.', semana: true });
  });
  return (
    <Sub title="Plano de aula" sub={`${p.passos.reduce((a, b) => a + b.min, 0)} min`} fallback="prof/mais" admin>
      <div className="os-card os-card--night" style={{ padding: 18 }}>
        <span className="os-overline" style={{ color: 'var(--on-night-muted)' }}>Técnica do dia</span>
        <input aria-label="Técnica do dia" value={tec} onChange={(e) => setTec(e.target.value)} onBlur={() => { if (tec !== p.tecnica) { salvarTec(); toast('Posição da semana atualizada no app dos alunos.'); } }}
          style={{ font: '700 26px/1.05 var(--font-display)', textTransform: 'uppercase', background: 'transparent', border: 0, borderBottom: '1px dashed rgba(255,255,255,0.3)', color: '#fff', outline: 'none', padding: '4px 0' }} />
        <span className="t-small os-muted">Vai aparecer como "posição da semana" no app dos alunos.</span>
      </div>
      {semana.length > 0 && (
        <>
          <Overline>Cronograma da semana</Overline>
          {semana.map((x) => (
            <div key={x.dia} className="os-card" style={{ gap: 6 }}>
              <div className="row-between"><span className="t-strong">{WD_LONG[x.dia]} · {x.tema}</span><span className="t-sub">{x.dur}</span></div>
              {x.posicoes && <span className="t-sub">{x.posicoes}</span>}
              {x.obs && <span className="t-small muted">{x.obs}</span>}
              <button className="os-btn os-btn--quiet os-btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setTec(x.tema); update((d) => { d.settings.planoAula.tecnica = x.tema; }); toast('Tema definido como técnica do dia.'); }}>Usar como técnica do dia</button>
            </div>
          ))}
        </>
      )}
      <div className="os-list">
        {p.passos.map((x, i) => (
          <button key={i} className="os-listrow" onClick={() => tog(i)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: x.done ? 'var(--success)' : 'transparent', border: x.done ? 0 : '2px solid var(--switch-off)', color: '#fff' }}>{x.done && <Icon n="check" size={14} sw={3} />}</span>
            <span className="os-listrow__body"><span className="os-listrow__title" style={{ textDecoration: x.done ? 'line-through' : 'none' }}>{x.t}</span><span className="os-listrow__meta">{x.d}</span></span>
            <span className="t-sub">{x.min} min</span>
          </button>
        ))}
      </div>
      <Chip tone={done === p.passos.length ? 'success' : 'info'}>{done} de {p.passos.length} concluídos</Chip>
      <button className="os-btn os-btn--quiet" onClick={() => update((d) => d.settings.planoAula.passos.forEach((x) => { x.done = false; }))}>Recomeçar aula</button>
    </Sub>
  );
}

/* N7 · Convidar aluno */
export function Convidar() {
  const db = useDB();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [turma, setTurma] = useState(db.aulas.find((a) => a.grupo !== 'Todos')?.id ?? '');
  const [belt, setBelt] = useState<BeltName>('Branca');
  const link = 'https://andrefeeelipe.github.io/Oseki/';
  const msg = `Oss${nome ? ', ' + nome.split(' ')[0] : ''}! Você foi convidado para o app da ${db.settings.academia}. Abra ${link} (ou baixe o app Android em github.com/andrefeeelipe/Oseki/releases/latest), toque em "Criar conta", use este e-mail (${email || 'seu e-mail'}) e o código ${db.settings.codigo}.`;
  const criar = () => {
    if (!nome.trim()) { toast('Informe o nome do aluno.'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast('Informe o e-mail do aluno: ele usa o mesmo e-mail para criar a conta.'); return false; }
    const agora = `${MES[today().getMonth()]} ${today().getFullYear()}`;
    update((d) => {
      d.students.push(novoAluno({ id: crypto.randomUUID(), nome: nome.trim(), email: email.trim().toLowerCase(), belt, turma, tel, convidado: true, desde: agora, matricula: String(Date.now()).slice(-6), hist: [{ t: 'Início no Jiu-Jitsu', d: agora }] }));
    });
    return true;
  };
  return (
    <Sub title="Convidar" sub="Novo aluno" fallback="prof/alunos" admin>
      <span className="t-small muted" style={{ padding: '0 4px' }}>A ficha do aluno já fica pronta. Quando ele criar a conta com o mesmo e-mail, entra direto nela.</span>
      <Field label="Nome do aluno"><input className="os-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" /></Field>
      <Field label="E-mail do aluno"><input className="os-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aluno@email.com" /></Field>
      <Field label="WhatsApp do aluno ou responsável"><input className="os-input" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(11) 90000-0000" /></Field>
      <span className="os-field__label">Turma</span>
      <div className="scroll-x">{db.aulas.filter((a) => a.grupo !== 'Todos').map((a) => <button key={a.id} className="os-pill" aria-pressed={turma === a.id} onClick={() => setTurma(a.id)}>{a.nome}</button>)}</div>
      <span className="os-field__label">Faixa inicial</span>
      <div className="scroll-x">{(['Branca', 'Cinza e Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom'] as BeltName[]).map((b) => <button key={b} className="os-pill" aria-pressed={belt === b} onClick={() => setBelt(b)}>{b}</button>)}</div>
      <div className="os-card os-card--flat">
        <span className="os-field__label">Código da academia</span>
        <span className="t-mono">{db.settings.codigo}</span>
      </div>
      <button className="os-btn os-btn--primary os-btn--block" onClick={() => { if (!criar()) return; window.open(`https://wa.me/${tel ? '55' + tel.replace(/\D/g, '') : ''}?text=${encodeURIComponent(msg)}`, '_blank'); toast('Ficha criada. Convite aberto no WhatsApp.'); setNome(''); setEmail(''); setTel(''); }}><Icon n="send" size={18} />Criar ficha e enviar no WhatsApp</button>
      <button className="os-btn os-btn--secondary os-btn--block" onClick={() => { if (criar()) { toast('Ficha criada.'); setNome(''); setEmail(''); setTel(''); } }}>Só criar a ficha</button>
    </Sub>
  );
}

/* N8 · Histórico do aluno */
export function Historico({ sid }: { sid?: string }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid) ?? db.students[0];
  const [month, setMonth] = useState(() => new Date(today().getFullYear(), today().getMonth(), 1));
  const a = aulaById(db, s.turma);
  const recs = db.att.filter((x) => x.sid === s.id);
  const ym = iso(month).slice(0, 7);
  const doMes = recs.filter((x) => x.date.startsWith(ym));
  const pres = new Set(doMes.filter((x) => x.status === 'ok').map((x) => x.date)).size;
  // falta = dia de aula da turma, no passado, sem registro
  let falt = 0;
  const fim = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  for (let d = new Date(month); d <= fim && d < today(); d = addDays(d, 1)) if (a?.dias.includes(d.getDay()) && !recs.some((x) => x.date === iso(d))) falt++;
  const stateOf = (d: string): DayState => {
    const r = recs.filter((x) => x.date === d);
    if (r.some((x) => x.status === 'ok')) return 'presente';
    if (r.some((x) => x.status === 'pend')) return 'pendente';
    if (r.some((x) => x.status === 'rej')) return 'falta';
    const dt = new Date(d + 'T00:00');
    if (dt < today() && a?.dias.includes(dt.getDay())) return 'falta';
    return null;
  };
  return (
    <Sub title="Histórico" sub={s.nome} fallback={`prof/aluno/${s.id}`} admin>
      <div className="row"><Avatar s={s} size={56} /><div className="col"><span className="t-title">{s.nome}</span><span className="t-sub">{a?.nome} · {a?.dias.map((d) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][d]).join('/')}</span></div></div>
      <div className="grid-3">
        {[[pres, 'presenças'], [falt, 'faltas'], [`${freqMes(db, s, fim < today() ? fim : today())}%`, 'no mês']].map(([v, l]) => <div key={l as string} className="os-stat" style={{ padding: 12 }}><span className="os-stat__value" style={{ fontSize: 26 }}>{v}</span><span className="os-stat__label">{l}</span></div>)}
      </div>
      <div className="os-card" style={{ padding: '16px 12px' }}>
        <div className="row-between" style={{ padding: '0 6px' }}>
          <button className="link" aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon n="back" size={18} /></button>
          <span className="t-strong">{MES_LONG[month.getMonth()]} {month.getFullYear()}</span>
          <button className="link" aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon n="chev" size={18} /></button>
        </div>
        <Calendar month={month} stateOf={stateOf} gpsOf={(d) => recs.some((x) => x.date === d && x.via === 'gps' && x.status === 'ok')} />
        <div style={{ padding: '0 6px' }}><Legend /></div>
      </div>
      <a className="os-btn os-btn--secondary" href={`https://wa.me/55${s.tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Icon n="send" size={18} />Enviar mensagem ao aluno</a>
    </Sub>
  );
}

/* N9 · Avaliação técnica (currículo + sorteio do exame) */
const NIV = ['Não vista', 'Em treino', 'Aprovada'];
export function Avaliacao({ sid }: { sid?: string }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid) ?? db.students[0];
  const [t, setT] = useState<Record<string, TecnicaNivel>>({ ...s.tecnicas });
  const [prova, setProva] = useState<number[] | null>(null);
  const [notas, setNotas] = useState<Record<number, string>>({});
  const p = passoExame(s);
  if (!p) return <Sub title="Avaliação" sub={s.nome} fallback={`prof/aluno/${s.id}`} admin><span className="t-sub">Faixa preta: sem currículo de exame no app.</span></Sub>;
  const ok = p.tecs.filter((x) => (t[chaveTec(p.faixa, x.n)] ?? 0) === 2).length;
  const vals = (prova ?? []).map((n) => parseFloat((notas[n] ?? '').replace(',', '.'))).filter((v) => !isNaN(v));
  const completa = !!prova && vals.length === prova.length;
  const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const aprovado = completa && media >= p.media;
  const nomeTec = (n: number) => p.c.tecnicas[n - 1];
  const salvarProva = (graduarJa: boolean) => {
    const novo = { ...t };
    prova!.forEach((n) => { const v = parseFloat((notas[n] ?? '').replace(',', '.')); novo[chaveTec(p.faixa, n)] = v >= p.media ? 2 : 1; });
    update((d) => {
      const a = d.students.find((y) => y.id === s.id)!;
      a.tecnicas = novo;
      a.exame = { ...(a.exame ?? {}), alvo: p.alvo, data: a.exame?.data ?? iso(today()), tecs: prova!, notas: prova!.map((n) => parseFloat((notas[n] ?? '0').replace(',', '.'))), media: Math.round(media * 10) / 10, aprovado };
      if (aprovado) a.apto = true;
      notify(d, s.id, aprovado ? 'Aprovado na avaliação. Oss!' : 'Resultado da avaliação', `Média ${media.toFixed(1).replace('.', ',')} (mínimo ${String(p.media).replace('.', ',')}).`, aprovado ? 'ok' : 'nota');
    });
    if (graduarJa) graduar([s.id]);
    toast(graduarJa ? `Graduado: ${p.alvo}. Oss!` : 'Avaliação salva e enviada ao aluno.');
    setT(novo); setProva(null); setNotas({});
  };
  return (
    <Sub title="Avaliação" sub={`${s.nome} · ${s.belt.toLowerCase()} · ${p.alvo}`} fallback={`prof/aluno/${s.id}`} admin>
      <div className="os-card os-card--flat" style={{ gap: 6 }}>
        <span className="t-strong">{p.exameFaixa ? 'Exame de troca de faixa' : 'Exame de grau'} · técnicas {p.de} a {p.ate}</span>
        <span className="t-sub">Sorteio de {p.qtd} técnicas, nota de 0 a 10. Média mínima {String(p.media).replace('.', ',')}.</span>
        {!prova && <button className="os-btn os-btn--primary os-btn--block" onClick={() => { setProva(sortear(p.de, p.ate, p.qtd)); setNotas({}); }}>Sortear {p.qtd} técnicas</button>}
      </div>
      {prova && (
        <>
          <Overline>Prova sorteada</Overline>
          {prova.map((n) => (
            <div key={n} className="os-card row" style={{ gap: 10, alignItems: 'center' }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{n}. {nomeTec(n)}</span>
              <input className="os-input" aria-label={`Nota da técnica ${n}`} inputMode="decimal" placeholder="0–10" style={{ width: 76, textAlign: 'center' }} value={notas[n] ?? ''} onChange={(e) => setNotas({ ...notas, [n]: e.target.value.replace(/[^0-9.,]/g, '').slice(0, 4) })} />
            </div>
          ))}
          <div className="os-card os-card--flat row-between" style={{ flexDirection: 'row' }}>
            <span className="t-strong">Média {vals.length ? media.toFixed(1).replace('.', ',') : '—'} · {vals.length} de {prova.length} notas</span>
            {completa && <Chip tone={aprovado ? 'success' : 'warning'}>{aprovado ? 'Aprovado' : 'Abaixo da média'}</Chip>}
          </div>
          {p.exameFaixa && p.c.solo.length > 0 && <span className="t-sub" style={{ padding: '0 4px' }}>Também cobrar movimentos de solo: {p.c.solo.join('; ')}.</span>}
          <div className="grid-2">
            <button className="os-btn os-btn--secondary" onClick={() => { setProva(null); setNotas({}); }}>Cancelar</button>
            <button className="os-btn os-btn--primary" disabled={!completa} onClick={() => salvarProva(false)}>Salvar resultado</button>
          </div>
          {aprovado && <button className="os-btn os-btn--primary os-btn--block" onClick={() => salvarProva(true)}>Salvar e graduar ({p.alvo})</button>}
        </>
      )}
      <Overline>Currículo · {ok} de {p.tecs.length} aprovadas</Overline>
      {p.tecs.map((x) => { const k = chaveTec(p.faixa, x.n); return (
        <div key={k} className="os-card" style={{ gap: 10 }}>
          <span className="t-strong" style={{ fontSize: 15 }}>{x.n}. {x.nome}</span>
          <div className="seg">{NIV.map((l, i) => <button key={l} aria-pressed={(t[k] ?? 0) === i} onClick={() => setT({ ...t, [k]: i as TecnicaNivel })}>{l}</button>)}</div>
        </div>
      ); })}
      <button className="os-btn os-btn--primary os-btn--block" onClick={() => { update((d) => { d.students.find((y) => y.id === s.id)!.tecnicas = t; notify(d, s.id, 'Avaliação técnica atualizada', `${ok} de ${p.tecs.length} técnicas aprovadas.`, 'nota'); }); toast('Avaliação salva e enviada ao aluno.'); }}>Salvar marcações</button>
    </Sub>
  );
}

/* N10 · Requisitos por faixa */
export function Requisitos() {
  const db = useDB();
  const [r, setR] = useState({ ...db.settings.requisitos });
  const tempo: Record<string, string> = { 'Branca': 'Adulto · mín. 1 ano', 'Cinza e Branca': 'Infantil · por grau', 'Amarela': 'Infantil · por grau', 'Laranja': 'Infantil · por grau', 'Verde': 'Infantil · por grau', 'Azul': 'Adulto · mín. 2 anos', 'Roxa': 'Adulto · mín. 1,5 ano', 'Marrom': 'Adulto · mín. 1 ano', 'Preta': 'Por grau · mín. 3 anos' };
  return (
    <Sub title="Requisitos" sub="Aulas por grau" fallback="prof/mais" admin>
      <span className="t-small muted" style={{ padding: '0 4px' }}>Aulas mínimas para cada grau. O app avisa o aluno e você quando a meta é batida.</span>
      <div className="os-list">
        {Object.keys(r).map((b) => (
          <div key={b} className="os-listrow">
            <span className="os-listrow__body"><span className="os-listrow__title">{b}</span><span className="os-listrow__meta">{tempo[b] ?? ''}</span></span>
            <Stepper v={r[b]} set={(v) => setR({ ...r, [b]: v })} min={1} label={`aulas da faixa ${b}`} />
          </div>
        ))}
      </div>
      <button className="os-btn os-btn--primary os-btn--block" onClick={() => { update((d) => { d.settings.requisitos = r; }); toast('Requisitos salvos.'); }}>Salvar requisitos</button>
    </Sub>
  );
}

/* N11 · Publicar técnica */
export function Publicar() {
  const db = useDB();
  const [f, setF] = useState({ titulo: '', cat: 'Guarda', faixaMin: 'Branca', semana: false, video: '', desc: '' });
  const [ok, setOk] = useState(false);
  if (ok) return (
    <Sub title="Publicar técnica" fallback="prof/mais" admin>
      <div className="empty" style={{ gap: 12 }}>
        <Icon n="checkCircle" size={40} style={{ color: 'var(--success)' }} />
        <span className="t-display-sm">Técnica publicada</span>
        <span className="t-small muted">Já aparece na biblioteca dos alunos a partir da faixa {f.faixaMin.toLowerCase()}.</span>
        <button className="os-btn os-btn--primary os-btn--block" onClick={() => { setOk(false); setF({ ...f, titulo: '', video: '', desc: '', semana: false }); }}>Publicar outra</button>
      </div>
    </Sub>
  );
  return (
    <Sub title="Publicar técnica" sub="Biblioteca da academia" fallback="prof/mais" admin>
      <Field label="Link do vídeo (YouTube, Instagram ou Google Drive)"><input className="os-input" type="url" value={f.video} onChange={(e) => setF({ ...f, video: e.target.value })} placeholder="https://youtu.be/…" /></Field>
      <span className="t-sub" style={{ padding: '0 4px' }}>Dica: suba o vídeo no YouTube como "não listado" e cole o link aqui.</span>
      <Field label="Título da técnica"><input className="os-input" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Ex.: Passagem toreando" /></Field>
      <span className="os-field__label">Categoria</span>
      <div className="scroll-x">{['Guarda', 'Passagem', 'Raspagem', 'Finalização', 'Defesa', 'Quedas'].map((c) => <button key={c} className="os-pill" aria-pressed={f.cat === c} onClick={() => setF({ ...f, cat: c })}>{c}</button>)}</div>
      <span className="os-field__label">Liberar a partir da faixa</span>
      <div className="scroll-x">{ADULTO.map((c) => <button key={c} className="os-pill" aria-pressed={f.faixaMin === c} onClick={() => setF({ ...f, faixaMin: c })}>{c}</button>)}</div>
      <div className="os-list"><Setting title="Posição da semana" sub="Destaque no início do app do aluno" on={f.semana} onChange={(v) => setF({ ...f, semana: v })} /></div>
      <Field label="Descrição"><textarea className="textarea" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Pontos-chave da técnica" /></Field>
      <button className="os-btn os-btn--primary os-btn--block" disabled={!f.titulo.trim()} onClick={() => {
        update((d) => {
          if (f.semana) d.tecnicas.forEach((t) => { t.semana = false; });
          d.tecnicas.unshift({ id: uid(), titulo: f.titulo.trim(), cat: f.cat, faixaMin: f.faixaMin, dur: '—', desc: f.desc.trim(), semana: f.semana, video: f.video.trim() || undefined, novo: true });
          d.students.forEach((s) => notify(d, s.id, 'Nova técnica na biblioteca', f.titulo.trim(), 'aviso'));
        });
        setOk(true);
      }}>Publicar técnica</button>
    </Sub>
  );
}

/* N12 · Financeiro */
export function Financeiro() {
  const db = useDB();
  const [pg, setPg] = useState<null | { sid: string; valor: string; via: string }>(null);
  const ativos = db.students.filter((s) => s.status !== 'inativo');
  const abertos = ativos.filter((s) => s.pay !== 'pago').sort((a, b) => (b.pay === 'analise' ? 1 : 0) - (a.pay === 'analise' ? 1 : 0));
  const pagos = ativos.filter((s) => s.pay === 'pago');
  const m = mesAtual();
  const recebido = ativos.reduce((t, s) => t + (s.pagamentos ?? []).filter((p) => p.mes === m).reduce((a, p) => a + p.valor, 0), 0);
  const previsto = ativos.reduce((t, s) => t + valorDe(db, s), 0);
  const cobrar = (sid: string) => update((d) => { notify(d, sid, 'Lembrete de mensalidade', 'Sua mensalidade está em aberto. Pague pelo app com Pix.', 'pay'); });
  const semPreco = PLANOS.some((p) => !db.settings.precos?.[p.id]);
  return (
    <Sub title="Financeiro" sub="Mensalidades" fallback="prof/mais" admin>
      <div className="os-card os-card--night" style={{ padding: 18 }}>
        <span className="os-muted t-small" style={{ textTransform: 'capitalize' }}>Recebido em {MES_LONG[today().getMonth()].toLowerCase()}</span>
        <span className="t-stat" style={{ fontSize: 40 }}>{recebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        <span className="os-muted t-small">{pagos.length} de {ativos.length} pagas · previsto {previsto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · vencimento dia {db.settings.vencimento || 15}</span>
        <div className="os-bar" style={{ background: 'rgba(255,255,255,0.15)' }}><div className="os-bar__fill" style={{ width: `${ativos.length ? (pagos.length / ativos.length) * 100 : 0}%`, background: '#5CC48A' }} /></div>
      </div>
      {semPreco && <button className="card-link" onClick={() => go('prof/x/academia')}><span className="ic"><Icon n="money" size={20} /></span><span className="grow col"><span className="t-strong" style={{ fontSize: 14 }}>Defina os valores dos planos</span><span className="t-sub">Em Dados da academia</span></span></button>}
      <Overline>Em aberto</Overline>
      <div className="os-list">
        {abertos.length === 0 && <div className="os-listrow"><span className="t-small muted">Todas pagas. Oss!</span></div>}
        {abertos.map((s) => (
          <div key={s.id} className="os-listrow">
            <Avatar s={s} size={34} />
            <span className="os-listrow__body"><span className="os-listrow__title">{s.nome}</span><span className="os-listrow__meta">{planoNome(s.plano)} · {brl(valorDe(db, s))} · {s.pay === 'atraso' ? `${s.payDias} dias de atraso` : s.pay === 'analise' ? 'aluno informou o Pix' : `vence dia ${db.settings.vencimento || 15}`}</span></span>
            {s.pay === 'analise'
              ? <button className="os-btn os-btn--primary os-btn--sm" onClick={() => setPg({ sid: s.id, valor: String(valorDe(db, s) || ''), via: 'Pix' })}>Confirmar</button>
              : <div className="row" style={{ gap: 6 }}><button className={`os-btn os-btn--sm ${s.pay === 'atraso' ? 'os-btn--danger' : 'os-btn--secondary'}`} onClick={() => { cobrar(s.id); toast(`Lembrete enviado para ${s.nome.split(' ')[0]}.`); }}>Cobrar</button><button className="os-btn os-btn--quiet os-btn--sm" onClick={() => setPg({ sid: s.id, valor: String(valorDe(db, s) || ''), via: 'Dinheiro' })}>Pago</button></div>}
          </div>
        ))}
      </div>
      <Overline>Pagos</Overline>
      <div className="os-list">
        {pagos.length === 0 && <div className="os-listrow"><span className="t-small muted">Nenhum pagamento neste mês.</span></div>}
        {pagos.map((s) => { const p = (s.pagamentos ?? []).find((x) => x.mes === m); return <div key={s.id} className="os-listrow"><span className="os-listrow__body"><span className="os-listrow__title">{s.nome}</span><span className="os-listrow__meta">{p?.via} · {p?.data}</span></span><span className="t-strong">{brl(p?.valor ?? 0)}</span></div>; })}
      </div>
      {pg && (
        <Sheet title="Registrar pagamento" onClose={() => setPg(null)}>
          <Field label="Valor (R$)"><input className="os-input" inputMode="decimal" value={pg.valor} onChange={(e) => setPg({ ...pg, valor: e.target.value })} /></Field>
          <div className="scroll-x">{['Pix', 'Dinheiro', 'Cartão', 'Transferência'].map((v) => <button key={v} className="os-pill" aria-pressed={pg.via === v} onClick={() => setPg({ ...pg, via: v })}>{v}</button>)}</div>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => { registrarPagamento(pg.sid, Number(pg.valor.replace(',', '.')) || 0, pg.via); setPg(null); toast('Pagamento registrado.'); }}>Confirmar pagamento</button>
        </Sheet>
      )}
    </Sub>
  );
}

/* N13 · Relatórios */
export function Relatorios() {
  const db = useDB();
  const [g, setG] = useState('Todos');
  const alunos = db.students.filter((s) => g === 'Todos' || grupoDe(s) === g);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today().getFullYear(), today().getMonth() - 5 + i, 1);
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const v = Math.round(alunos.reduce((a, s) => a + freqMes(db, s, fim < today() ? fim : today()), 0) / (alunos.length || 1));
    return { l: MES[d.getMonth()], v };
  });
  const ano = new Date(today().getFullYear(), 0, 1);
  const sessoes = new Set(db.att.filter((x) => x.date >= iso(ano) && x.status === 'ok').map((x) => x.date + x.classId));
  const pres = db.att.filter((x) => x.date >= iso(ano) && x.status === 'ok' && alunos.some((s) => s.id === x.sid)).length;
  const csv = () => {
    const rows = [['Aluno', 'Faixa', 'Graus', 'Turma', 'Frequência 30d', 'Presenças no ano', 'Mensalidade'], ...alunos.map((s) => [s.nome, s.belt, s.graus, aulaById(db, s.turma)?.nome ?? '', `${freq(db, s)}%`, presencas(db, s.id, ano, today()).length, s.pay])];
    const blob = new Blob(['﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oseki-relatorio-${iso(today())}.csv`; a.click();
    toast('Planilha exportada.');
  };
  return (
    <Sub title="Relatórios" sub="Frequência e aulas" fallback="prof/mais" admin>
      <div className="scroll-x">{['Todos', 'Kids', 'Teens', 'Adulto'].map((x) => <button key={x} className="os-pill" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}</div>
      <div className="os-card"><span className="t-title">Frequência média por mês</span><Bars data={meses} hl={5} fmt={(v) => `${v}%`} /></div>
      <div className="grid-2">
        <div className="os-stat"><span className="os-stat__value">{sessoes.size}</span><span className="os-stat__label">aulas dadas em {today().getFullYear()}</span></div>
        <div className="os-stat"><span className="os-stat__value">{sessoes.size ? (pres / sessoes.size).toFixed(1).replace('.', ',') : 0}</span><span className="os-stat__label">alunos por aula</span></div>
      </div>
      <div className="grid-2">
        <button className="os-btn os-btn--secondary" onClick={csv}>Exportar planilha</button>
        <button className="os-btn os-btn--secondary" onClick={() => window.print()}>Exportar PDF</button>
      </div>
    </Sub>
  );
}

/* N15 · Perfil do professor */
export function PerfilProf() {
  const db = useDB();
  const eu = db.profs.find((p) => p.id === db.session?.sid);
  const [f, setF] = useState({ nome: eu?.nome ?? '', tel: eu?.tel ?? '', belt: (eu?.belt ?? 'Preta') as BeltName, graus: eu?.graus ?? 0 });
  const [senha, setSenha] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const mudou = !!eu && (f.nome !== eu.nome || f.tel !== eu.tel || f.belt !== eu.belt || f.graus !== eu.graus);
  const minhas = db.aulas.filter((x) => x.prof === eu?.nome);
  const salvar = () => {
    if (!f.nome.trim()) { toast('Informe seu nome.'); return; }
    update((d) => {
      const p = d.profs.find((x) => x.id === d.session?.sid)!;
      const antigo = p.nome;
      Object.assign(p, { ...f, nome: f.nome.trim() });
      d.aulas.forEach((a) => { if (a.prof === antigo) a.prof = p.nome; });
    });
    toast('Perfil salvo.');
  };
  return (
    <Sub title="Meu perfil" fallback="prof/mais" admin>
      <div className="col center" style={{ gap: 10 }}>
        <Avatar s={{ nome: f.nome || 'Professor', belt: f.belt, foto: eu?.foto }} size={96} />
        <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => cam.current?.click()}><Icon n="camera" size={16} />Alterar foto</button>
        <input ref={cam} type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const foto = await fileToAvatar(file); update((d) => { d.profs.find((x) => x.id === d.session?.sid)!.foto = foto; }); toast('Foto atualizada.'); }} />
      </div>
      <Field label="Nome (como aparece para os alunos)"><input className="os-input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Prof. Diego Oseki" /></Field>
      <Field label="Telefone"><input className="os-input" inputMode="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} /></Field>
      <span className="os-field__label">Faixa</span>
      <div className="scroll-x">{ADULTO.map((b) => <button key={b} className="os-pill" aria-pressed={f.belt === b} onClick={() => setF({ ...f, belt: b })}>{b}</button>)}</div>
      <span className="os-field__label">Graus</span>
      <div className="seg">{[0, 1, 2, 3, 4, 5, 6].map((n) => <button key={n} aria-pressed={f.graus === n} onClick={() => setF({ ...f, graus: n })}>{n}</button>)}</div>
      <button className="os-btn os-btn--primary os-btn--block" disabled={!mudou} onClick={salvar}>{mudou ? 'Salvar alterações' : 'Dados salvos'}</button>
      <div className="grid-3">
        {[[minhas.length, 'turmas'], [minhas.reduce((t, x) => t + x.dias.length, 0), 'aulas/sem.'], [db.students.filter((x) => x.status !== 'inativo').length, 'alunos']].map(([v, l]) => <div key={l as string} className="os-stat" style={{ padding: 12 }}><span className="os-stat__value" style={{ fontSize: 26 }}>{v}</span><span className="os-stat__label">{l}</span></div>)}
      </div>
      <div className="kv" style={{ padding: '0 4px' }}><span>E-mail de acesso</span><span>{db.session?.email}</span></div>
      <LinkCard icon="settings" title="Dados da academia" sub="Valores, Pix, códigos e equipe" onClick={() => go('prof/x/academia')} />
      <LinkCard icon="star" title="Requisitos de graduação" onClick={() => go('prof/x/requisitos')} />
      <LinkCard icon="lock" title="Trocar senha" onClick={() => setSenha(true)} />
      <button className="os-btn os-btn--danger" onClick={() => sair()}>Sair</button>
        <span className="t-sub" style={{ textAlign: 'center' }}>Versão {__VERSAO__}</span>
      {senha && <TrocarSenha onClose={() => setSenha(false)} />}
    </Sub>
  );
}

/* Admin · Contratos */
export function Contratos() {
  const db = useDB();
  const [fil, setFil] = useState('');
  const ST = { ativo: ['Ativo', 'success'], vence: ['Vence logo', 'warning'], vencido: ['Vencido', 'danger'], assin: ['Sem assinatura', 'info'] } as const;
  const AC = { vence: ['Renovar contrato', 'Renovado'], vencido: ['Enviar renovação', 'Renovação enviada'], assin: ['Reenviar para assinar', 'Link enviado'] } as const;
  const kpis = (['ativo', 'vence', 'vencido', 'assin'] as const).map((k) => ({ k, v: db.students.filter((s) => s.contrato.status === k).length }));
  const act = (sid: string, k: keyof typeof AC) => {
    update((d) => {
      const s = d.students.find((x) => x.id === sid)!;
      if (k === 'vence') { s.contrato.status = 'ativo'; s.contrato.vig = `até ${br(addDays(today(), 90))}`; }
      notify(d, sid, k === 'assin' ? 'Assine seu contrato' : 'Renovação do contrato', k === 'assin' ? 'Abra Meu plano para assinar.' : 'Seu contrato foi renovado/enviado para renovação.', 'info');
    });
    toast(`${AC[k][1]}.`);
  };
  return (
    <Sub title="Contratos" sub="Vencimentos e assinaturas" fallback="prof/mais" admin>
      <div className="grid-2" style={{ gap: 10 }}>
        {kpis.map(({ k, v }) => (
          <button key={k} aria-pressed={fil === k} onClick={() => setFil(fil === k ? '' : k)} className={`os-stat ${k === 'vence' ? 'os-stat--warning' : k === 'vencido' ? 'os-stat--danger' : ''}`} style={{ border: `2px solid ${fil === k ? 'var(--ink)' : 'transparent'}`, textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }}>
            <span className="os-stat__value" style={{ fontSize: 30 }}>{v}</span><span className="os-stat__label">{ST[k][0].toLowerCase()}</span>
          </button>
        ))}
      </div>
      {db.students.filter((s) => !fil || s.contrato.status === fil).map((s) => {
        const [l, tone] = ST[s.contrato.status];
        const a = AC[s.contrato.status as keyof typeof AC];
        return (
          <div key={s.id} className="os-card os-card--flat" style={{ gap: 10 }}>
            <div className="row-between"><span className="row" style={{ gap: 8 }}><span className="t-strong" style={{ fontSize: 15 }}>{s.nome}</span>{s.fundador && <span className="os-seal os-seal--fundador">Fundador</span>}</span><Chip tone={tone}>{l}</Chip></div>
            <span className="t-sub">{planoNome(s.plano)} · {s.contrato.vig}</span>
            {a && <button className="os-btn os-btn--primary" onClick={() => act(s.id, s.contrato.status as keyof typeof AC)}>{a[0]}</button>}
          </div>
        );
      })}
    </Sub>
  );
}

/* Admin · Controle de acesso */
export function Acesso() {
  const db = useDB();
  const es = entradasHoje(db);
  const bloq = es.filter((e) => e.bloq && !e.liberado).length;
  const liberar = (id: string, nome: string) => { update((d) => { d.access.push({ id, h: '', nome, meio: '', motivo: '', bloq: true, liberado: true }); }); toast(`Entrada de ${nome.split(' ')[0]} liberada.`); };
  return (
    <Sub title="Controle de acesso" sub="Entrada na academia hoje" fallback="prof/mais" admin>
      <div className="grid-2" style={{ gap: 10 }}>
        <div className="os-stat os-stat--night"><span className="os-stat__value" style={{ fontSize: 36 }}>{es.length - bloq}</span><span className="os-stat__label">no tatame agora</span></div>
        <div className="os-stat os-stat--danger"><span className="os-stat__value" style={{ fontSize: 36, color: 'var(--danger)' }}>{bloq}</span><span className="os-stat__label">entradas bloqueadas</span></div>
      </div>
      <Overline>Entradas ao vivo</Overline>
      {es.length === 0 && <div className="empty"><span className="t-small muted">Nenhuma entrada hoje.</span></div>}
      {es.map((e) => {
        const b = e.bloq && !e.liberado;
        return (
          <div key={e.id} className="os-card os-card--flat row" style={{ flexDirection: 'row', background: b ? 'var(--danger-soft)' : 'var(--surface)' }}>
            <span className="col center" style={{ width: 44 }}><span className="t-strong" style={{ fontSize: 13 }}>{e.h}</span><span className="t-sub" style={{ fontSize: 10 }}>{e.meio}</span></span>
            <span className="grow col" style={{ gap: 3 }}><span className="t-strong" style={{ fontSize: 14 }}>{e.nome}</span><span className="t-sub">{e.liberado ? 'Liberado manualmente' : e.motivo}</span></span>
            {b ? <button className="os-btn os-btn--primary os-btn--sm" onClick={() => liberar(e.id, e.nome)}>Liberar</button> : <Chip tone="success">Liberado</Chip>}
          </div>
        );
      })}
      <button className="os-btn os-btn--secondary" onClick={() => go('painel/acesso')}>Regras de acesso no painel desktop</button>
    </Sub>
  );
}

export { INFANTIL, iniciais, PLANOS };
