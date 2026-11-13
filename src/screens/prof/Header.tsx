import { useDB, logout } from '../../data/store';
import { go } from '../../ui/router';
import { Icon } from '../../ui/Icon';

export function ProfHeader({ title }: { title: string }) {
  const db = useDB();
  const unread = db.notifs.filter((n) => n.to === 'prof' && !n.read).length;
  return (
    <div className="os-tatame hero" style={{ gap: 14, paddingBottom: 22 }}>
      <div className="row-between">
        <div className="col" style={{ gap: 2 }}>
          <span className="os-tatame__sub">Prof. Marangoni · faixa preta</span>
          <span className="t-greeting" style={{ fontSize: 32 }}>{title}</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" aria-label={`Notificações${unread ? `, ${unread} novas` : ''}`} onClick={() => go('prof/x/notif')}><Icon n="bell" size={20} />{unread > 0 && <span className="badge">{unread}</span>}</button>
          <button className="icon-btn" aria-label="Sair" onClick={() => { logout(); go('login'); }}><Icon n="logout" size={20} /></button>
        </div>
      </div>
      <div style={{ height: 10, borderRadius: 3, background: '#111', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.15)' }}><div style={{ position: 'absolute', right: '10%', top: 0, bottom: 0, width: '28%', background: 'var(--ponteira)' }} /></div>
    </div>
  );
}

