import { useState } from 'react';
import { marcarPresenca, toast } from '../../data/store';
import { addDays, aulasDoAluno, fromIso, iso, MES_LONG, today, WD_LONG, MES, freqMes } from '../../data/util';
import { Calendar, Chip, Legend, attChip, type DayState } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { useMe } from './common';

export default function Presenca() {
  const { db, me } = useMe();
  const [month, setMonth] = useState(() => new Date(today().getFullYear(), today().getMonth(), 1));
  const [sel, setSel] = useState(iso(today()));
  const mine = db.att.filter((x) => x.sid === me.id);
  const byDate = (d: string) => mine.filter((x) => x.date === d);
  const ym = iso(month).slice(0, 7);
  const doMes = mine.filter((x) => x.date.startsWith(ym));
  const pres = new Set(doMes.filter((x) => x.status === 'ok').map((x) => x.date)).size;
  const pend = doMes.filter((x) => x.status === 'pend').length;
  const ehMesAtual = ym === iso(today()).slice(0, 7);
  const fm = ehMesAtual ? freqMes(db, me) : freqMes(db, me, new Date(month.getFullYear(), month.getMonth() + 1, 0));

  const stateOf = (d: string): DayState => {
    const r = byDate(d);
    if (r.some((x) => x.status === 'ok')) return 'presente';
    if (r.some((x) => x.status === 'pend')) return 'pendente';
    if (r.some((x) => x.status === 'rej')) return 'falta';
    return null;
  };

  const selD = fromIso(sel);
  const aulasDia = aulasDoAluno(db, me).filter((a) => a.dias.includes(selD.getDay()));
  const futuro = sel > iso(today());
  const antigo = sel < iso(addDays(today(), -14));
  const recs = byDate(sel);

  const marcar = (classId: string) => {
    marcarPresenca(me.id, classId, sel, 'app');
    toast('Presença enviada. O professor vai aprovar.');
  };

  return (
    <div className="scroll">
      <div className="screen-title">
        <span className="t-display-md">Minha presença</span>
        <span className="t-small" style={{ color: 'var(--ink-subtle)' }}>Toque em um dia para ver ou marcar a aula</span>
      </div>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div className="grid-3" style={{ gap: 10 }}>
          {[[pres, 'presenças'], [pend, 'aguardando'], [`${fm}%`, 'frequência']].map(([v, l]) => (
            <div key={l as string} className="os-stat" style={{ borderRadius: 16, padding: 12, gap: 2 }}>
              <span className="os-stat__value" style={{ fontSize: 28 }}>{v}</span><span className="os-stat__label" style={{ fontSize: 11 }}>{l}</span>
            </div>
          ))}
        </div>

        <div className="os-card" style={{ padding: '16px 12px', gap: 10 }}>
          <div className="row-between" style={{ padding: '0 6px' }}>
            <button className="back" style={{ width: 36, height: 36, boxShadow: 'none', background: 'var(--surface-sunken)' }} aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon n="back" size={16} /></button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{MES_LONG[month.getMonth()]} {month.getFullYear()}</span>
            <button className="back" style={{ width: 36, height: 36, boxShadow: 'none', background: 'var(--surface-sunken)' }} aria-label="Próximo mês" disabled={ehMesAtual} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon n="chev" size={16} /></button>
          </div>
          <Calendar month={month} stateOf={stateOf} gpsOf={(d) => byDate(d).some((x) => x.via === 'gps' && x.status === 'ok')} selected={sel} onPick={setSel} />
          <div style={{ padding: '6px 6px 0' }}><Legend /></div>
        </div>

        <div className="os-card" style={{ padding: '16px 18px', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{WD_LONG[selD.getDay()]}, {selD.getDate()} de {MES[selD.getMonth()]}</span>
          {aulasDia.length === 0 && recs.length === 0 && <span className="t-small muted">Sem aula da sua turma neste dia.</span>}
          {aulasDia.map((a) => {
            const r = recs.find((x) => x.classId === a.id);
            const c = attChip(r);
            const pode = !futuro && !antigo && (!r || r.status === 'rej') && db.settings.metodos.app;
            return (
              <div key={a.id} className="col-2" style={{ paddingBottom: 6 }}>
                <div className="row-between">
                  <span className="t-small muted">{a.nome} · {a.ini} – {a.fim}</span>
                  {!futuro && <Chip tone={c.tone}>{r ? c.t : 'Sem registro'}</Chip>}
                </div>
                {pode && <button className="os-btn os-btn--primary" onClick={() => marcar(a.id)}>Marcar que estive presente</button>}
              </div>
            );
          })}
          {futuro && aulasDia.length > 0 && <span className="t-sub">A marcação abre no dia da aula.</span>}
          {antigo && !futuro && aulasDia.length > 0 && <span className="t-sub">Marcações ficam abertas por 14 dias. Fale com o professor.</span>}
        </div>
      </div>
    </div>
  );
}
