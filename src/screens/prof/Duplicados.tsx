import { useState } from 'react';
import { useDB, update, toast, mesclarAlunos } from '../../data/store';
import { possiveisDuplicados, parDup, grausTxt, ultimoTreino } from '../../data/util';
import type { Student } from '../../data/types';
import { Sub, Avatar, Belt, Chip, Sheet } from '../../ui/kit';

/* Cadastros duplicados: o app encontra fichas parecidas e o professor junta em uma. */
export function Duplicados() {
  const db = useDB();
  const pares = possiveisDuplicados(db);
  const [abrir, setAbrir] = useState<{ a: Student; b: Student } | null>(null);
  return (
    <Sub title="Duplicados" sub={pares.length ? `${pares.length} possíveis` : 'Nenhum encontrado'} fallback="prof/alunos" admin>
      <span className="t-small muted" style={{ padding: '0 4px' }}>O app compara nome, e-mail e telefone. Confira e junte as fichas da mesma pessoa. Presenças, pagamentos e histórico das duas ficam juntos.</span>
      {pares.length === 0 && <div className="os-card"><span className="t-small muted">Nenhum cadastro duplicado. Oss!</span></div>}
      {pares.map(({ a, b, motivo }) => (
        <div key={parDup(a.id, b.id)} className="os-card" style={{ gap: 10 }}>
          <Chip tone="warning">{motivo}</Chip>
          <Mini s={a} /><Mini s={b} />
          <div className="grid-2">
            <button className="os-btn os-btn--secondary" onClick={() => { update((d) => { d.settings.naoDuplicados = [...(d.settings.naoDuplicados ?? []), parDup(a.id, b.id)]; }); toast('Marcado como pessoas diferentes.'); }}>Não é a mesma</button>
            <button className="os-btn os-btn--primary" onClick={() => setAbrir({ a, b })}>Mesclar</button>
          </div>
        </div>
      ))}
      {abrir && <Mesclar a={abrir.a} b={abrir.b} onClose={() => setAbrir(null)} />}
    </Sub>
  );
}

function Mini({ s }: { s: Student }) {
  const db = useDB();
  const u = ultimoTreino(db, s);
  return (
    <div className="row" style={{ gap: 10, alignItems: 'center' }}>
      <Avatar s={s} size={40} />
      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span style={{ fontWeight: 700 }}>{s.nome}{s.apelido ? <span className="muted"> · {s.apelido}</span> : null}</span>
        <span className="t-sub">{s.belt} · {grausTxt(s.graus)} · {s.aulas} aulas{u ? ` · último treino ${u.split('-').reverse().join('/')}` : ''}</span>
        <span className="t-sub">{s.email || 'sem e-mail'} · {s.tel || 'sem telefone'} · {s.convidado ? 'sem app' : 'usa o app'}</span>
      </div>
    </div>
  );
}

/** Folha de mesclagem: escolher qual ficha prevalece. */
export function Mesclar({ a, b, onClose }: { a: Student; b: Student; onClose: () => void }) {
  const [manter, setManter] = useState(a.convidado && !b.convidado ? b.id : a.id);
  const [busy, setBusy] = useState(false);
  const fica = manter === a.id ? a : b;
  const sai = manter === a.id ? b : a;
  const ok = async () => {
    setBusy(true); const r = await mesclarAlunos(fica.id, sai.id); setBusy(false);
    if (r) { toast(r); return; }
    toast('Fichas mescladas.'); onClose();
  };
  return (
    <Sheet title="Mesclar alunos" onClose={onClose}>
      <span className="t-small muted">Qual ficha tem os dados certos? Ela prevalece. O que estiver vazio nela vem da outra.</span>
      {[a, b].map((s) => (
        <button key={s.id} className="os-card" aria-pressed={manter === s.id} onClick={() => setManter(s.id)} style={{ textAlign: 'left', cursor: 'pointer', border: manter === s.id ? '2px solid var(--brand-ink)' : '1px solid var(--line)' }}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <span style={{ width: 44 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></span>
            <span className="col grow"><span style={{ fontWeight: 700 }}>{s.nome}</span><span className="t-sub">{s.belt} · {grausTxt(s.graus)} · {s.email || 'sem e-mail'}</span></span>
            {manter === s.id && <Chip tone="success">fica</Chip>}
          </div>
        </button>
      ))}
      {!a.convidado && !b.convidado && <span className="t-small" style={{ color: 'var(--danger)' }}>As duas fichas têm conta no app. Depois de mesclar, só o login de {fica.email || fica.nome} continua funcionando.</span>}
      <button className="os-btn os-btn--primary os-btn--block" disabled={busy} onClick={ok}>{busy ? 'Mesclando…' : `Mesclar em ${fica.nome.split(' ')[0]}`}</button>
      <span className="t-sub">A ficha de {sai.nome} deixa de existir. Isso não pode ser desfeito.</span>
    </Sheet>
  );
}
