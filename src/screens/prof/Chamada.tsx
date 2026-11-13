import { useState } from 'react';
import { useDB, profMarcar, decidir, toast } from '../../data/store';
import type { DB, Aula } from '../../data/types';
import { addDays, aulasDoDia, grupoDe, iso, today, WD, WD_LONG, MES_LONG, primeiro } from '../../data/util';
import { Avatar, Belt, Chip, attChip } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { ProfHeader } from './Header';

export const rosterDe = (db: DB, a: Aula) => db.students.filter((s) => s.turma === a.id || a.grupo === 'Todos' || grupoDe(s) === a.grupo || db.att.some((x) => x.sid === s.id && x.classId === a.id));

export default function Chamada() {
  const db = useDB();
  const [dia, setDia] = useState(() => { for (let k = 0; k < 7; k++) { const d = addDays(today(), -k); if (aulasDoDia(db, d).length) return iso(d); } return iso(today()); });
  const d = new Date(dia + 'T00:00');
  const aulas = aulasDoDia(db, d);
  const [sel, setSel] = useState<string | null>(null);
  const aula = aulas.find((a) => a.id === sel) ?? aulas[0];
  const recs = db.att.filter((x) => x.date === dia);
  const count = (a: Aula) => new Set(recs.filter((x) => x.classId === a.id && x.status === 'ok').map((x) => x.sid)).size;
  const roster = aula ? rosterDe(db, aula).sort((a, b) => Number(b.turma === aula.id) - Number(a.turma === aula.id) || a.nome.localeCompare(b.nome)) : [];

  return (
    <div className="scroll">
      <ProfHeader title="Chamada" />
      <div className="pad" style={{ paddingTop: 18 }}>
        <div className="scroll-x">
          {Array.from({ length: 7 }, (_, i) => addDays(today(), -i)).map((x) => {
            const tem = aulasDoDia(db, x).length > 0;
            return <button key={iso(x)} className="os-pill" disabled={!tem} style={{ opacity: tem ? 1 : 0.4, flexShrink: 0 }} aria-pressed={iso(x) === dia} onClick={() => { setDia(iso(x)); setSel(null); }}>{iso(x) === iso(today()) ? 'Hoje' : `${WD[x.getDay()]} ${x.getDate()}`}</button>;
          })}
        </div>
        <span className="os-overline" style={{ padding: '0 4px' }}>{WD_LONG[d.getDay()]}, {d.getDate()} de {MES_LONG[d.getMonth()]}</span>
        {aulas.length === 0 && <div className="empty"><span className="t-small muted">Sem aulas neste dia.</span></div>}
        <div className="grid-2" style={{ gap: 10 }}>
          {aulas.map((a) => {
            const on = a.id === aula?.id;
            return (
              <button key={a.id} onClick={() => setSel(a.id)} aria-pressed={on} style={{ textAlign: 'left', border: 0, cursor: 'pointer', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2, background: on ? 'var(--brand)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink)' }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{a.ini} – {a.fim}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{a.nome}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{count(a)} presentes</span>
              </button>
            );
          })}
        </div>
        {aula && (
          <>
            <div className="row-between" style={{ padding: '0 4px' }}>
              <span className="t-title">{aula.nome}</span>
              <button className="os-btn os-btn--secondary os-btn--sm" onClick={() => go(`prof/x/qr/${aula.id}`)}><Icon n="qr" size={16} />QR da aula</button>
            </div>
            <div className="os-list">
              {roster.length === 0 && <div className="os-listrow"><span className="t-small muted">Ninguém nesta turma ainda.</span></div>}
              {roster.map((s) => {
                const r = recs.find((x) => x.sid === s.id && x.classId === aula.id) ?? null;
                const c = attChip(r);
                return (
                  <div key={s.id} className="os-listrow">
                    <button style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }} aria-label={`Abrir ${s.nome}`} onClick={() => go(`prof/aluno/${s.id}`)}><Avatar s={s} /></button>
                    <div className="os-listrow__body" style={{ gap: 5 }}>
                      <span className="os-listrow__title">{s.nome}</span>
                      <div className="row" style={{ gap: 8 }}><div style={{ width: 36 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></div><Chip tone={r ? c.tone : 'neutral'}>{r ? c.t : 'Ausente'}</Chip></div>
                    </div>
                    {r?.status === 'pend' ? (
                      <button className="os-btn os-btn--primary os-btn--sm" onClick={() => { decidir(r.id, true); toast(`Presença de ${primeiro(s.nome)} aprovada.`); }}>Aprovar</button>
                    ) : r?.status === 'ok' ? (
                      <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => { profMarcar(s.id, aula.id, dia); toast(`Presença de ${primeiro(s.nome)} removida.`); }}>Desfazer</button>
                    ) : (
                      <button className="os-btn os-btn--secondary os-btn--sm" onClick={() => { profMarcar(s.id, aula.id, dia); toast(`${primeiro(s.nome)} marcado presente.`); }}>Marcar</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="row" style={{ alignItems: 'flex-start', padding: '0 4px', gap: 10 }}>
              <Icon n="pin" size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
              <span className="t-sub" style={{ lineHeight: 1.5 }}>"Auto · GPS" = o aluno entrou no raio de {db.settings.raio} m da academia no horário da aula. Presença já contabilizada.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
