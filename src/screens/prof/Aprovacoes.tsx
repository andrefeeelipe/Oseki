import { useDB, decidir, aprovarTodas, toast } from '../../data/store';
import { aulaById, curta, fromIso, primeiro } from '../../data/util';
import { Avatar } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { ProfHeader } from './Header';

export default function Aprovacoes() {
  const db = useDB();
  const reqs = db.att.filter((x) => x.status === 'pend').sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="scroll">
      <ProfHeader title="Aprovações" />
      <div className="pad" style={{ paddingTop: 18 }}>
        <div className="row-between" style={{ padding: '0 4px' }}>
          <span className="os-overline">Marcações feitas pelos alunos</span>
          {reqs.length > 1 && <button className="link" onClick={() => { aprovarTodas(); toast(`${reqs.length} presenças aprovadas.`); }}>Aprovar todas</button>}
        </div>
        {reqs.map((q) => {
          const s = db.students.find((x) => x.id === q.sid)!;
          const a = aulaById(db, q.classId);
          return (
            <div key={q.id} className="os-card" style={{ gap: 14 }}>
              <div className="row">
                <Avatar s={s} />
                <div className="grow col" style={{ gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{s.nome}</span>
                  <span className="t-sub">{a?.nome} · {curta(fromIso(q.date))} · {a?.ini}{q.via === 'gps' ? ' · via GPS' : q.via === 'qr' ? ' · via QR' : ''}</span>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 10 }}>
                <button className="os-btn os-btn--danger" onClick={() => { decidir(q.id, false); toast(`Presença de ${primeiro(s.nome)} recusada.`); }}>Recusar</button>
                <button className="os-btn os-btn--primary" onClick={() => { decidir(q.id, true); toast('Presença aprovada.'); }}>Aprovar</button>
              </div>
            </div>
          );
        })}
        {reqs.length === 0 && (
          <div className="empty">
            <Icon n="checkCircle" size={36} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Tudo em dia. Oss!</span>
            <span className="t-small muted">Nenhuma presença aguardando aprovação.</span>
          </div>
        )}
      </div>
    </div>
  );
}
