import { useEffect } from 'react';
import { useDB, lerTodas, update } from '../../data/store';
import type { Notif } from '../../data/types';
import { Sub, Overline, tempoRel } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';

const IC: Record<Notif['kind'], [string, string, string]> = {
  pend: ['inbox', 'var(--warning-soft)', 'var(--warning)'],
  gps: ['pin', 'var(--success-soft)', 'var(--success)'],
  ok: ['check', 'var(--success-soft)', 'var(--success)'],
  meta: ['star', 'var(--night)', '#fff'],
  grad: ['belt', 'var(--night)', '#fff'],
  pay: ['money', 'var(--danger-soft)', 'var(--danger)'],
  nota: ['edit', 'var(--info-soft)', 'var(--brand-ink)'],
  aviso: ['megaphone', 'var(--info-soft)', 'var(--brand-ink)'],
  info: ['bell', 'var(--surface-sunken)', 'var(--ink-muted)'],
};

export default function Notificacoes({ to, fallback }: { to: string; fallback: string }) {
  const db = useDB();
  const list = db.notifs.filter((n) => n.to === to);
  useEffect(() => () => lerTodas(to), [to]);
  const hoje = new Date().toDateString();
  const grupos: [string, Notif[]][] = [['Hoje', list.filter((n) => new Date(n.at).toDateString() === hoje)], ['Anteriores', list.filter((n) => new Date(n.at).toDateString() !== hoje)]];
  const open = (n: Notif) => {
    update((d) => { const x = d.notifs.find((y) => y.id === n.id); if (x) x.read = true; });
    if (to === 'prof') { if (n.kind === 'pend') go('prof/aprovacoes'); else if (n.kind === 'pay') go('prof/x/financeiro'); else if (n.kind === 'meta') go('prof/x/graduacao'); }
    else { if (n.kind === 'nota' || n.kind === 'grad') go('aluno/faixa'); else if (n.kind === 'ok' || n.kind === 'info') go('aluno/presenca'); else if (n.kind === 'pay') go('aluno/x/mensalidade'); }
  };
  return (
    <Sub title="Notificações" sub={`${list.filter((n) => !n.read).length} novas`} fallback={fallback} admin={to === 'prof'}>
      {list.length === 0 && <div className="empty"><span className="t-small muted">Nada por aqui ainda.</span></div>}
      {grupos.map(([g, ns]) => ns.length > 0 && (
        <div key={g} className="col-2">
          <Overline>{g}</Overline>
          <div className="os-list">
            {ns.map((n) => {
              const [ic, bg, fg] = IC[n.kind];
              return (
                <button key={n.id} className="os-listrow" onClick={() => open(n)} style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', alignItems: 'flex-start' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 18, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n={ic} size={17} /></span>
                  <span className="os-listrow__body"><span className="os-listrow__title" style={{ fontWeight: n.read ? 500 : 700 }}>{n.t}</span><span className="os-listrow__meta">{n.d}</span></span>
                  <span className="col" style={{ alignItems: 'flex-end', gap: 6 }}><span className="t-sub" style={{ fontSize: 11 }}>{tempoRel(n.at)}</span>{!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--ponteira)' }} aria-label="não lida" />}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Sub>
  );
}
