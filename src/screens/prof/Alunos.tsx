import { useState } from 'react';
import { getDB, useDB, setFaixa, setApto, addNote, toast, update, registrarPagamento, estornarPagamento } from '../../data/store';
import { PLANOS, planoNome } from '../../data/seed';
import type { PlanoId, Student } from '../../data/types';
import { ALL_BELTS, ADULTO, INFANTIL, aulaById, freq, grausTxt, grupoDe, idadeDe, metaDe, pct, valorDe, brl, mesAtual, diasSemTreino, ultimoTreino, possiveisDuplicados } from '../../data/util';
import { Mesclar } from './Duplicados';
import { Sheet, Field } from '../../ui/kit';
import { Avatar, Belt, Chip, Setting, StatCard, SubHeader, LinkCard } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { ProfHeader } from './Header';
import type { BeltName } from '../../data/types';

export function Alunos() {
  const db = useDB();
  const [q, setQ] = useState('');
  const [g, setG] = useState('Todos');
  const dups = possiveisDuplicados(db).length;
  const ausente = (s: Student) => { const d = diasSemTreino(db, s); return d == null || d > 30; };
  const lista = db.students.filter((s) => (s.nome + ' ' + (s.apelido ?? '')).toLowerCase().includes(q.toLowerCase()) && (g === 'Inativos' ? s.status === 'inativo' : s.status !== 'inativo' && (g === 'Todos' || (g === 'Ausentes' ? ausente(s) : g === 'Sem app' ? !!s.convidado : grupoDe(s) === g)))).sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <div className="scroll">
      <ProfHeader title="Alunos" />
      <div className="pad" style={{ paddingTop: 18 }}>
        <label className="sr-only" htmlFor="busca">Buscar aluno</label>
        <input id="busca" type="search" className="os-input" style={{ background: 'var(--surface)' }} placeholder="Buscar aluno" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="scroll-x">{['Todos', 'Ausentes', 'Sem app', 'Kids', 'Teens', 'Adulto', 'Inativos'].map((x) => <button key={x} className="os-pill" aria-pressed={g === x} onClick={() => setG(x)}>{x}</button>)}
          <button className="os-pill" onClick={() => go('prof/x/convidar')}><Icon n="plus" size={16} />&nbsp;Convidar</button></div>
        {dups > 0 && (
          <button className="os-card row" style={{ gap: 12, alignItems: 'center', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--warning)', flexDirection: 'row' }} onClick={() => go('prof/x/duplicados')}>
            <Icon n="users" size={20} />
            <span className="col grow"><span className="t-strong">{dups} {dups === 1 ? 'possível cadastro duplicado' : 'possíveis cadastros duplicados'}</span><span className="t-sub">Toque para revisar e mesclar</span></span>
          </button>
        )}
        <div className="os-list" style={{ padding: '4px 14px' }}>
          {lista.map((s) => (
            <button key={s.id} className="os-listrow" onClick={() => go(`prof/aluno/${s.id}`)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }}>
              <Avatar s={s} />
              <span className="os-listrow__body" style={{ gap: 6 }}>
                <span className="os-listrow__title">{s.nome}{s.apelido ? <span className="muted"> · {s.apelido}</span> : null}</span>
                <span className="row" style={{ gap: 8 }}><span style={{ width: 44 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></span><span className="t-sub">{s.belt} · {grausTxt(s.graus)}</span>{s.convidado && <Chip tone="info">sem app</Chip>}{ausente(s) && s.status !== 'inativo' && <Chip tone="warning">{diasSemTreino(db, s) == null ? 'sem treino' : `${diasSemTreino(db, s)}d sem treinar`}</Chip>}</span>
              </span>
              <span className="col" style={{ alignItems: 'flex-end' }}><span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{freq(db, s)}%</span><span className="t-sub" style={{ fontSize: 11 }}>freq.</span></span>
            </button>
          ))}
          {lista.length === 0 && <div className="os-listrow"><span className="t-small muted">{db.students.length === 0 ? `Nenhum aluno ainda. Passe o código ${db.settings.codigo} para os alunos criarem a conta no app, ou use Convidar.` : 'Nenhum aluno encontrado.'}</span></div>}
        </div>
      </div>
    </div>
  );
}

export function AlunoDetalhe({ sid }: { sid: string }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid);
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState(false);
  const [juntar, setJuntar] = useState<string | null>(null);
  const [buscaJ, setBuscaJ] = useState('');
  const [pg, setPg] = useState<null | { valor: string; via: string }>(null);
  if (!s) return <div className="scroll"><SubHeader title="Aluno" fallback="prof/alunos" /></div>;
  const meusDups = possiveisDuplicados(db).filter((p) => p.a.id === s.id || p.b.id === s.id).map((p) => ({ b: p.a.id === s.id ? p.b : p.a, motivo: p.motivo }));
  const outroJ = juntar ? db.students.find((x) => x.id === juntar) : undefined;
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
      <div className="row" style={{ gap: 8, padding: '6px 20px 0', flexDirection: 'row' }}>
        <button className="os-btn os-btn--primary os-btn--sm" onClick={() => setEdit(true)}><Icon n="edit" size={16} />Editar dados</button>
        <button className="os-btn os-btn--secondary os-btn--sm" onClick={() => setJuntar('')}>Mesclar com…</button>
      </div>
      {meusDups.map(({ b, motivo }) => (
        <div key={b.id} className="pad" style={{ paddingTop: 10, paddingBottom: 0 }}>
          <button className="os-card" style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--warning)' }} onClick={() => setJuntar(b.id)}>
            <span className="t-strong">Possível duplicado: {b.nome}</span><span className="t-sub">{motivo} · toque para mesclar</span>
          </button>
        </div>
      ))}
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
          {!s.contrato.assinado && <Chip tone="info">Contrato sem assinatura</Chip>}
        </div>

        <div className="os-card" style={{ padding: 18 }}>
          <div className="row-between"><span className="t-title">Mensalidade</span><Chip tone={s.pay === 'pago' ? 'success' : s.pay === 'atraso' ? 'danger' : s.pay === 'analise' ? 'info' : 'warning'}>{s.pay === 'pago' ? 'Em dia' : s.pay === 'atraso' ? `Atrasada · ${s.payDias} dias` : s.pay === 'analise' ? 'Aluno informou Pix' : 'Em aberto'}</Chip></div>
          <div className="kv" style={{ padding: '6px 0' }}><span>{planoNome(s.plano)}{s.fundador ? ` · fundador #${s.fundador}` : ''}</span><span>{brl(valorDe(db, s))}</span></div>
          {s.pay !== 'pago' && <button className="os-btn os-btn--primary" onClick={() => setPg({ valor: String(valorDe(db, s) || ''), via: 'Pix' })}>Registrar pagamento do mês</button>}
          {(s.pagamentos ?? []).slice(0, 4).map((p) => <div key={p.mes} className="kv" style={{ padding: '8px 0', fontSize: 13 }}><span>{p.mes.split('-').reverse().join('/')} · {p.via}</span><span>{brl(p.valor)}{p.mes === mesAtual() && <button className="link" style={{ marginLeft: 10, fontSize: 12, color: 'var(--danger)' }} onClick={() => { if (confirm('Desfazer o pagamento deste mês?')) { estornarPagamento(s.id, p.mes); toast('Pagamento desfeito.'); } }}>desfazer</button>}</span></div>)}
        </div>

        <div className="os-card" style={{ padding: 18 }}>
          <div className="row-between"><span className="t-title">Dados do aluno</span><button className="link" onClick={() => setEdit(true)}>Editar</button></div>
          {s.apelido && <div className="kv" style={{ padding: '8px 0' }}><span>Apelido</span><span>{s.apelido}</span></div>}
          <div className="kv" style={{ padding: '8px 0' }}><span>Último treino</span><span>{ultimoTreino(db, s)?.split('-').reverse().join('/') ?? '—'}</span></div>
          {s.totalAnterior != null && <div className="kv" style={{ padding: '8px 0' }}><span>Aulas antes do app</span><span>{s.totalAnterior}</span></div>}
          {s.exame?.data && <div className="kv" style={{ padding: '8px 0' }}><span>Exame</span><span>{s.exame.alvo} · {s.exame.data.split('-').reverse().join('/')}{s.exame.media != null ? ` · média ${s.exame.media}` : ''}</span></div>}
          {s.alertaPlanilha && <div className="kv" style={{ padding: '8px 0' }}><span>Obs. planilha</span><span>{s.alertaPlanilha}</span></div>}
          {s.convidado && <div className="kv" style={{ padding: '8px 0' }}><span>App</span><span>Ainda não criou acesso</span></div>}
          <div className="kv" style={{ padding: '8px 0' }}><span>Nascimento</span><span>{s.nasc || '—'}</span></div>
          <div className="kv" style={{ padding: '8px 0' }}><span>Telefone</span><span>{s.tel || '—'}</span></div>
          <div className="kv" style={{ padding: '8px 0' }}><span>Responsável</span><span>{s.resp || '—'}</span></div>
          <div className="kv" style={{ padding: '8px 0' }}><span>E-mail</span><span>{s.email || '—'}</span></div>
        </div>

        <div className="os-card" style={{ padding: 18 }}>
          <label htmlFor="nota" style={{ fontSize: 15, fontWeight: 700 }}>Anotações sobre o aluno</label>
          <textarea id="nota" className="textarea" placeholder="Ex.: refinar a passagem de meia-guarda" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="os-btn os-btn--primary" disabled={!note.trim()} onClick={() => { addNote(s.id, note.trim()); setNote(''); toast('Anotação salva e enviada ao app do aluno.'); }}>Salvar anotação</button>
          {s.notes.map((n, i) => <div key={i} className="divider col" style={{ paddingTop: 12, gap: 4 }}><span className="t-sub">{n.d}</span><span className="t-body">{n.t}</span></div>)}
        </div>
        <button className="os-btn os-btn--danger" onClick={() => { const inat = s.status === 'inativo'; if (confirm(inat ? 'Reativar este aluno?' : 'Marcar este aluno como inativo? Ele some das listas, mas o histórico fica guardado.')) { update((d) => { d.students.find((x) => x.id === s.id)!.status = inat ? 'ativo' : 'inativo'; }); toast(inat ? 'Aluno reativado.' : 'Aluno marcado como inativo.'); } }}>{s.status === 'inativo' ? 'Reativar aluno' : 'Marcar como inativo'}</button>
        {s.tel && <a className="os-btn os-btn--secondary" href={`https://wa.me/55${s.tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Icon n="send" size={18} />Mensagem no WhatsApp</a>}
      </div>
      {edit && <EditAluno sid={s.id} onClose={() => setEdit(false)} />}
      {juntar !== null && outroJ && <Mesclar a={s} b={outroJ} onClose={() => { setJuntar(null); if (!getDB().students.some((x) => x.id === s.id)) go('prof/alunos'); }} />}
      {juntar === '' && (
        <Sheet title={`Mesclar ${s.nome.split(' ')[0]} com…`} onClose={() => setJuntar(null)}>
          <input className="os-input" placeholder="Buscar aluno" value={buscaJ} onChange={(e) => setBuscaJ(e.target.value)} />
          <div className="col" style={{ gap: 6, maxHeight: '45dvh', overflowY: 'auto' }}>
            {db.students.filter((x) => x.id !== s.id && x.nome.toLowerCase().includes(buscaJ.toLowerCase())).slice(0, 30).map((x) => (
              <button key={x.id} className="sheet-opt" onClick={() => setJuntar(x.id)}>{x.nome} · {x.belt}</button>
            ))}
          </div>
        </Sheet>
      )}
      {pg && (
        <Sheet title="Registrar pagamento" onClose={() => setPg(null)}>
          <Field label="Valor (R$)"><input className="os-input" inputMode="decimal" value={pg.valor} onChange={(e) => setPg({ ...pg, valor: e.target.value })} /></Field>
          <div className="scroll-x">{['Pix', 'Dinheiro', 'Cartão', 'Transferência'].map((v) => <button key={v} className="os-pill" aria-pressed={pg.via === v} onClick={() => setPg({ ...pg, via: v })}>{v}</button>)}</div>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => { registrarPagamento(s.id, Number(pg.valor.replace(',', '.')) || 0, pg.via); setPg(null); toast('Pagamento registrado.'); }}>Confirmar pagamento</button>
        </Sheet>
      )}
    </div>
  );
}

export function EditAluno({ sid, onClose }: { sid: string; onClose: () => void }) {
  const db = useDB();
  const s = db.students.find((x) => x.id === sid)!;
  const [f, setF] = useState({ nome: s.nome, apelido: s.apelido ?? '', nasc: s.nasc, tel: s.tel, resp: s.resp, email: s.email, turma: s.turma, plano: s.plano as PlanoId });
  return (
    <Sheet title="Editar aluno" onClose={onClose}>
      <div className="col-2" style={{ maxHeight: '60dvh', overflowY: 'auto', paddingBottom: 4 }}>
        <Field label="Nome"><input className="os-input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
        <Field label="Apelido"><input className="os-input" value={f.apelido} onChange={(e) => setF({ ...f, apelido: e.target.value })} /></Field>
        <Field label="Nascimento"><input className="os-input" placeholder="dd/mm/aaaa" value={f.nasc} onChange={(e) => setF({ ...f, nasc: e.target.value })} /></Field>
        <Field label="Telefone"><input className="os-input" inputMode="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} /></Field>
        <Field label="Responsável"><input className="os-input" value={f.resp} onChange={(e) => setF({ ...f, resp: e.target.value })} /></Field>
        <Field label="E-mail"><input className="os-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Turma"><select className="select" value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}><option value="">Sem turma</option>{db.aulas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></Field>
        <Field label="Plano"><select className="select" value={f.plano} onChange={(e) => setF({ ...f, plano: e.target.value as PlanoId })}>{PLANOS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></Field>
      </div>
      <button className="os-btn os-btn--primary os-btn--block" onClick={() => { if (!f.nome.trim()) { toast('Informe o nome.'); return; } update((d) => { Object.assign(d.students.find((x) => x.id === sid)!, { ...f, nome: f.nome.trim() }); }); toast('Dados do aluno salvos.'); onClose(); }}>Salvar</button>
    </Sheet>
  );
}
