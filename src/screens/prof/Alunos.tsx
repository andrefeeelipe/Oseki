import { useState } from 'react';
import { useDB, setFaixa, setApto, addNote, toast } from '../../data/store';
import { ALL_BELTS, ADULTO, INFANTIL, aulaById, freq, grausTxt, grupoDe, idadeDe, metaDe, pct } from '../../data/util';
import { Avatar, Belt, Chip, Setting, StatCard, SubHeader, LinkCard } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { ProfHeader } from './Header';
import type { BeltName } from '../../data/types';

export function Alunos() {
  const db = useDB();
  const [q, setQ] = useState('');
  const [g, setG] = useState('Todos');
  const lista = db.students.filter((s) => s.nome.toLowerCase().includes(q.toLowerCase()) && (g === 'Todos' || grupoDe(s) === g));
  return (
    <div className="scroll">
      <ProfHeader title="Alunos" />
      <div className="pad" style={{ paddingTop: 18 }}>
        <label className="sr-only" htmlFor="busca">Buscar aluno</label>
        <input id="busca" type="search" className="os-input" style={{ background: 'var(--surface)' }} placeholder="Buscar aluno" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="scroll-x">{['Todos', 'Kids', 'Teens', 'Adulto'].map((x) => <button key={x} className="os-pill" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
          <button className="os-pill" onClick={() => go('prof/x/convidar')}><Icon n="plus" size={16} />&nbsp;Convidar</button></div>
        <div className="os-list" style={{ padding: '4px 14px' }}>
          {lista.map((s) => (
            <button key={s.id} className="os-listrow" onClick={() => go(`prof/aluno/${s.id}`)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }}>
              <Avatar s={s} />
              <span className="os-listrow__body" style={{ gap: 6 }}>
                <span className="os-listrow__title">{s.nome}{s.convidado ? ' · convidado' : ''}</span>
                <span className="row" style={{ gap: 8 }}><span style={{ width: 44 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></span><span className="t-sub">{s.belt} · {grausTxt(s.graus)}</span></span>
              </span>
              <span className="col" style={{ alignItems: 'flex-end' }}><span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{freq(db, s)}%</span><span className="t-sub" style={{ fontSize: 11 }}>freq.</span></span>
            </button>
          ))}
          {lista.length === 0 && <div className="os-listrow"><span className="t-small muted">Nenhum aluno encontrado.</span></div>}
        </div>
      </div>
    </div>
  );
}

export function AlunoDetalhe({ sid }: { sid: string }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid);
  const [note, setNote] = useState('');
  if (!s) return <div className="scroll"><SubHeader title="Aluno" fallback="prof/alunos" /></div>;
  const meta = metaDe(db, s);
  const opts: BeltName[] = grupoDe(s) === 'Adulto' ? ADULTO : Array.from(new Set([...INFANTIL, ...ADULTO]));
  return (
    <div className="scroll">
      <SubHeader title={s.nome.split(' ')[0]} sub="Ficha do aluno" fallback="prof/alunos" />
      <div className="row" style={{ padding: '10px 20px 6px', gap: 16 }}>
        <Avatar s={s} size={72} />
        <div className="col" style={{ gap: 3 }}>
          <span style={{ font: '700 30px/1 var(--font-display)', textTransform: 'uppercase' }}>{s.nome}</span>
          <span className="t-small muted">{aulaById(db, s.turma)?.nome} · {idadeDe(s.nasc)} anos</span>
          {s.fundador && <span className="os-seal os-seal--fundador" style={{ alignSelf: 'flex-start' }}>Fundador #{s.fundador}</span>}
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div className="os-card" style={{ padding: 18, gap: 14 }}>
          <div className="row-between"><span style={{ fontSize: 15, fontWeight: 700 }}>Graduação</span><span className="t-small muted">{s.belt} · {grausTxt(s.graus)}</span></div>
          <Belt belt={s.belt} graus={s.graus} />
          <span className="os-overline">Faixa</span>
          <div className="grid-2" style={{ gap: 8, maxHeight: 196, overflowY: 'auto', padding: 2 }}>
            {opts.filter((b) => ALL_BELTS.includes(b)).map((b) => (
              <button key={b} aria-pressed={s.belt === b} onClick={() => { setFaixa(s.id, b, 0); toast(`Faixa de ${s.nome.split(' ')[0]} atualizada.`); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 10px', borderRadius: 12, cursor: 'pointer', font: '600 13px var(--font-sans)', textAlign: 'left', color: 'var(--ink)', background: s.belt === b ? 'var(--info-soft)' : 'var(--surface)', border: `1.5px solid ${s.belt === b ? 'var(--brand-ink)' : 'var(--line-strong)'}` }}>
                <span style={{ width: 30, flexShrink: 0 }}><Belt belt={b} graus={0} size="sm" /></span><span>{b}</span>
              </button>
            ))}
          </div>
          <span className="os-overline">Graus</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((n) => (
              <button key={n} aria-pressed={s.graus === n} onClick={() => { setFaixa(s.id, s.belt, n); toast('Graus atualizados.'); }}
                style={{ height: 44, borderRadius: 12, cursor: 'pointer', font: '700 15px var(--font-sans)', border: `1.5px solid ${s.graus === n ? 'var(--ink)' : 'var(--line-strong)'}`, background: s.graus === n ? 'var(--ink)' : 'var(--surface)', color: s.graus === n ? 'var(--surface)' : 'var(--ink)' }}>{n}</button>
            ))}
          </div>
          <Setting title="Apto para exame" sub="Libera a avaliação técnica no app do aluno" on={s.apto} onChange={(v) => { setApto(s.id, v); toast(v ? 'Aluno liberado para o exame.' : 'Liberação removida.'); }} />
        </div>

        <div className="grid-2">
          <StatCard label="AULAS NA FAIXA" value={s.aulas} of={meta} bar={pct(s.aulas, meta)} />
          <StatCard label="FREQUÊNCIA" value={`${freq(db, s)}%`} foot="últimos 30 dias" />
        </div>

        <div className="grid-2">
          <LinkCard icon="cal" title="Histórico" onClick={() => go(`prof/x/historico/${s.id}`)} right={<></>} />
          <LinkCard icon="star" title="Avaliação" onClick={() => go(`prof/x/avaliacao/${s.id}`)} right={<></>} />
        </div>
        <div className="row" style={{ gap: 8 }}>
          {s.pay !== 'pago' && <Chip tone={s.pay === 'atraso' ? 'danger' : s.pay === 'analise' ? 'info' : 'warning'}>{s.pay === 'atraso' ? `Mensalidade atrasada · ${s.payDias} dias` : s.pay === 'analise' ? 'Pagamento em análise' : 'Mensalidade em aberto'}</Chip>}
          {!s.contrato.assinado && <Chip tone="info">Contrato sem assinatura</Chip>}
        </div>

        <div className="os-card" style={{ padding: 18 }}>
          <label htmlFor="nota" style={{ fontSize: 15, fontWeight: 700 }}>Anotações sobre o aluno</label>
          <textarea id="nota" className="textarea" placeholder="Ex.: refinar a passagem de meia-guarda" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="os-btn os-btn--primary" disabled={!note.trim()} onClick={() => { addNote(s.id, note.trim()); setNote(''); toast('Anotação salva e enviada ao app do aluno.'); }}>Salvar anotação</button>
          {s.notes.map((n, i) => <div key={i} className="divider col" style={{ paddingTop: 12, gap: 4 }}><span className="t-sub">{n.d}</span><span className="t-body">{n.t}</span></div>)}
        </div>
        {s.tel && <a className="os-btn os-btn--secondary" href={`https://wa.me/55${s.tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Icon n="send" size={18} />Mensagem no WhatsApp</a>}
      </div>
    </div>
  );
}
