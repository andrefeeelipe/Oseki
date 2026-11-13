import { useState } from 'react';
import { useDB, update, toast } from '../../data/store';
import type { DB } from '../../data/types';
import { addDays, grupoDe, presencas, today, primeiro, semanasSeguidas } from '../../data/util';
import { Sub, Avatar } from '../../ui/kit';

export function rankingDe(db: DB, per: number, grp: string) {
  const from = per === 0 ? addDays(today(), -today().getDay()) : per === 1 ? new Date(today().getFullYear(), today().getMonth(), 1) : new Date(today().getFullYear(), 0, 1);
  return db.students
    .filter((s) => s.status !== 'inativo' && (grp === 'Todos' || grupoDe(s) === grp))
    .map((s) => ({ s, v: new Set(presencas(db, s.id, from, today()).map((x) => x.date + x.classId)).size, seq: semanasSeguidas(db, s.id) }))
    .sort((a, b) => b.v - a.v || a.s.nome.localeCompare(b.s.nome));
}

export default function Ranking({ prof, fallback }: { prof: boolean; fallback: string }) {
  const db = useDB();
  const [per, setPer] = useState(1);
  const [grp, setGrp] = useState('Todos');
  const list = rankingDe(db, per, prof ? grp : 'Todos');
  const meId = db.session?.sid;
  const meIdx = list.findIndex((r) => r.s.id === meId);
  const me = list[meIdx];
  const ahead = meIdx > 0 ? list[meIdx - 1].v - me.v : 0;
  const podium = [1, 0, 2].filter((i) => list[i]);

  return (
    <Sub title="Ranking" sub={prof ? 'Presença dos alunos' : 'Quem mais treinou'} fallback={fallback} admin={prof}>
      <div className="seg">{['Semana', 'Mês', 'Ano'].map((l, i) => <button key={l} aria-pressed={per === i} onClick={() => setPer(i)}>{l}</button>)}</div>
      {!prof && me && (
        <div className="os-card" style={{ background: 'var(--brand)', color: '#fff', flexDirection: 'row', alignItems: 'center', gap: 14, padding: '16px 18px', boxShadow: 'none' }}>
          <span style={{ font: '700 48px/0.9 var(--font-display)' }}>{meIdx + 1}º</span>
          <div className="grow col"><span style={{ fontSize: 15, fontWeight: 700 }}>Sua posição</span><span className="t-sub on-night-muted">{ahead > 0 ? `${ahead} ${ahead === 1 ? 'aula' : 'aulas'} para subir uma posição` : meIdx === 0 ? 'Você lidera. Oss!' : 'Mantenha o ritmo!'}</span></div>
          <span style={{ font: '700 32px var(--font-display)' }}>{me.v}</span>
        </div>
      )}
      {prof && <div className="scroll-x">{['Todos', 'Kids', 'Teens', 'Adulto'].map((g) => <button key={g} className="os-pill" aria-pressed={grp === g} onClick={() => setGrp(g)}>{g}</button>)}</div>}
      <div className="grid-3" style={{ alignItems: 'end' }}>
        {podium.map((i) => {
          const r = list[i];
          return (
            <div key={r.s.id} className="col center" style={{ gap: 6 }}>
              <Avatar s={r.s} size={i === 0 ? 56 : 40} ring={i === 0 ? 'var(--fundador)' : undefined} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{primeiro(r.s.nome)}</span>
              <div style={{ width: '100%', borderRadius: '14px 14px 4px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: i === 0 ? 110 : i === 1 ? 86 : 70, background: i === 0 ? 'var(--night)' : 'var(--surface)', color: i === 0 ? '#fff' : 'var(--ink)' }}>
                <span style={{ font: '700 28px/1 var(--font-display)' }}>{i + 1}º</span><span style={{ fontSize: 12 }}>{r.v} aulas</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="os-list" style={{ padding: '4px 14px' }}>
        {list.slice(3).map((r, i) => {
          const eu = r.s.id === meId && !prof;
          return (
            <div key={r.s.id} className="os-listrow" style={eu ? { background: 'var(--info-soft)', borderRadius: 12, padding: '10px 6px' } : { padding: '10px 6px' }}>
              <span style={{ width: 26, font: '700 20px var(--font-display)' }}>{i + 4}</span>
              <Avatar s={r.s} size={34} />
              <span className="grow" style={{ fontSize: 14, fontWeight: 600 }}>{r.s.nome}{eu ? ' (você)' : ''}</span>
              <span className="num" style={{ fontSize: 14, fontWeight: 700 }}>{r.v}</span>
            </div>
          );
        })}
      </div>
      {prof && (
        <button className="os-btn os-btn--primary os-btn--block" onClick={() => { update((d) => { d.settings.rankingPublicado = true; }); toast('Ranking publicado no app dos alunos.'); }}>
          {db.settings.rankingPublicado ? 'Publicado no app' : 'Divulgar ranking no app'}
        </button>
      )}
    </Sub>
  );
}
