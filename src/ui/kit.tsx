import type { ReactNode } from 'react';
import type { BeltName, Student, Attendance } from '../data/types';
import { BELTS, ringOf, iniciais, WD_INI, iso, today, fromIso } from '../data/util';
import { useToast } from '../data/store';
import { Icon } from './Icon';
import { back } from './router';

/* ---------- Faixa ---------- */
export function Belt({ belt, graus, size = 'md', style }: { belt: BeltName; graus: number; size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties }) {
  const b = BELTS[belt];
  return (
    <div className={`os-belt os-belt--${b.cls} ${size === 'md' ? '' : 'os-belt--' + size}`} style={style} role="img" aria-label={`Faixa ${belt.toLowerCase()}, ${graus} ${graus === 1 ? 'grau' : 'graus'}`}>
      {b.stripe && <div className={`os-belt__stripe ${b.stripe === 'preta' ? 'os-belt__stripe--preta' : ''}`} />}
      <div className="os-belt__tip">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`os-belt__grau ${i < graus ? 'os-belt__grau--on' : ''}`} />)}
      </div>
    </div>
  );
}

/* ---------- Avatar com anel na cor da faixa ---------- */
export function Avatar({ s, size = 40, ring }: { s: Pick<Student, 'nome' | 'belt'> & { foto?: string }; size?: 34 | 40 | 56 | 72 | 96; ring?: string }) {
  const cls = size === 72 ? 'os-avatar os-avatar--lg' : size === 40 ? 'os-avatar' : `os-avatar av-${size}`;
  return (
    <div className={cls} style={{ ['--ring' as string]: ring ?? ringOf(s.belt) }}>
      {s.foto ? <img src={s.foto} alt="" /> : iniciais(s.nome)}
    </div>
  );
}

/* ---------- Chip, selo, switch ---------- */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export const Chip = ({ tone, children }: { tone: Tone; children: ReactNode }) => <span className={`os-chip os-chip--${tone}`}>{children}</span>;
export const Seal = ({ kind, children }: { kind: 'fundador' | 'admin' | 'destaque'; children: ReactNode }) => <span className={`os-seal os-seal--${kind}`}>{children}</span>;
export const Switch = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button className="os-switch" aria-pressed={on} aria-label={label} onClick={() => onChange(!on)} />
);
export function Setting({ title, sub, on, onChange }: { title: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="setting">
      <div className="col"><span className="t-strong" style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>{sub && <span className="t-sub">{sub}</span>}</div>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
}

export function attChip(a?: Attendance | null): { tone: Tone; t: string } {
  if (!a) return { tone: 'neutral', t: 'Sem registro' };
  if (a.status === 'pend') return { tone: 'warning', t: 'Aguardando aprovação' };
  if (a.status === 'rej') return { tone: 'danger', t: 'Recusada' };
  return { tone: 'success', t: a.via === 'gps' ? 'Auto · GPS' : a.via === 'qr' ? 'QR Code' : a.via === 'prof' ? 'Marcado pelo prof.' : 'Aprovada' };
}

/* ---------- Estrutura de tela ---------- */
export function SubHeader({ title, sub, fallback, admin, right }: { title: string; sub?: string; fallback: string; admin?: boolean; right?: ReactNode }) {
  return (
    <div className="subhead">
      <button className="back" aria-label="Voltar" onClick={() => back(fallback)}><Icon n="back" size={18} sw={2.2} /></button>
      <div className="grow col" style={{ gap: 1 }}>
        <span style={{ font: '700 30px/1 var(--font-display)', textTransform: 'uppercase' }}>{title}</span>
        {sub && <span className="t-sub">{sub}</span>}
      </div>
      {admin && <Seal kind="admin">Admin</Seal>}
      {right}
    </div>
  );
}

export function Sub({ title, sub, fallback, admin, children, right }: { title: string; sub?: string; fallback: string; admin?: boolean; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="scroll">
      <SubHeader title={title} sub={sub} fallback={fallback} admin={admin} right={right} />
      <div className="pad" style={{ paddingTop: 10 }}>{children}</div>
    </div>
  );
}

export const Overline = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => <span className="os-overline" style={{ padding: '6px 4px 0', ...style }}>{children}</span>;

export function StatCard({ label, value, of, bar, foot }: { label: string; value: ReactNode; of?: ReactNode; bar?: number; foot?: string }) {
  return (
    <div className="os-card" style={{ gap: 6 }}>
      <span className="os-overline" style={{ letterSpacing: '0.08em' }}>{label}</span>
      <span className="t-stat">{value}{of != null && <span style={{ fontSize: 18, color: 'var(--ink-subtle)' }}>/{of}</span>}</span>
      {bar != null && <div className="os-bar"><div className="os-bar__fill" style={{ width: `${bar}%` }} /></div>}
      {foot && <span className="t-caption">{foot}</span>}
    </div>
  );
}

export function Toast() {
  const m = useToast();
  if (!m) return null;
  return <div className="toast-wrap"><div className="os-toast" role="status">{m}</div></div>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" aria-hidden="true" />
        <span className="t-title" style={{ paddingBottom: 6 }}>{title}</span>
        {children}
        <button className="os-btn os-btn--quiet" style={{ marginTop: 8 }} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export function Bars({ data, hl, fmt }: { data: { l: string; v: number }[]; hl?: number; fmt?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="bars" role="img" aria-label={data.map((d) => `${d.l}: ${fmt ? fmt(d.v) : d.v}`).join(', ')}>
      {data.map((d, i) => (
        <div className="b" key={d.l + i}>
          <b>{fmt ? fmt(d.v) : d.v}</b>
          <i className={i === hl ? 'hl' : ''} style={{ height: `${(d.v / max) * 78}%` }} />
          <span>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Calendário do mês ---------- */
export type DayState = 'presente' | 'pendente' | 'falta' | 'rest' | null;
export function Calendar({ month, stateOf, gpsOf, selected, onPick, compact }: {
  month: Date; stateOf: (isoDate: string) => DayState; gpsOf?: (isoDate: string) => boolean; selected?: string; onPick?: (isoDate: string) => void; compact?: boolean;
}) {
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const t = iso(today());
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(y, m, i + 1)))];
  return (
    <div className="cal">
      {WD_INI.map((w, i) => <span className="wd" key={i}>{w}</span>)}
      {cells.map((c, i) => {
        if (!c) return <span key={i} />;
        const stt = stateOf(c);
        const cls = ['os-day', stt === 'presente' ? 'os-day--presente' : stt === 'pendente' ? 'os-day--pendente' : stt === 'falta' ? 'os-day--falta' : stt === 'rest' ? 'os-day--rest' : '', c === t ? 'os-day--hoje' : ''].join(' ');
        const n = fromIso(c).getDate();
        const label = `${n}: ${stt === 'presente' ? 'presente' : stt === 'pendente' ? 'aguardando aprovação' : stt === 'falta' ? 'recusada ou falta' : 'sem registro'}`;
        return (
          <button key={c} className={cls} style={compact ? { height: 36 } : undefined} aria-pressed={selected === c} aria-label={label} onClick={() => onPick?.(c)}>
            <span>{n}</span>
            <span className={`os-day__dot ${gpsOf?.(c) ? 'os-day__dot--gps' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}

export function Legend() {
  return (
    <div className="legend">
      <span><i style={{ background: 'var(--brand)' }} />Presente</span>
      <span><i style={{ background: 'var(--warning-soft)', border: '1.5px dashed var(--warning)' }} />Aguardando</span>
      <span><i style={{ background: 'var(--danger-soft)' }} />Recusada</span>
      <span><i style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)' }} />Via GPS</span>
    </div>
  );
}

export function TabBar({ items, current, label }: { items: { id: string; l: string; icon: string; badge?: number; onClick: () => void }[]; current: string; label: string }) {
  return (
    <nav className="os-tabbar" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} className="os-tab" aria-current={current === it.id ? 'page' : undefined} onClick={it.onClick}>
          <Icon n={it.icon} />
          {it.badge ? <span className="badge" aria-label={`${it.badge} pendentes`}>{it.badge}</span> : null}
          {it.l}
        </button>
      ))}
    </nav>
  );
}

export function LinkCard({ icon, title, sub, onClick, right }: { icon: string; title: string; sub?: string; onClick: () => void; right?: ReactNode }) {
  return (
    <button className="card-link" onClick={onClick}>
      <span className="ic"><Icon n={icon} size={20} /></span>
      <span className="grow col"><span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>{sub && <span className="t-sub">{sub}</span>}</span>
      {right ?? <Icon n="chev" size={18} style={{ color: 'var(--ink-subtle)' }} />}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="os-field"><span className="os-field__label">{label}</span>{children}</label>;
}

export function Stepper({ v, set, min = 0, max = 999, label }: { v: number; set: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="stepper">
      <button aria-label={`Diminuir ${label}`} onClick={() => set(Math.max(min, v - 1))}>−</button>
      <span className="t-stat" style={{ fontSize: 24, minWidth: 34, textAlign: 'center' }}>{v}</span>
      <button aria-label={`Aumentar ${label}`} onClick={() => set(Math.min(max, v + 1))}>+</button>
    </div>
  );
}

export const tempoRel = (isoStr: string) => {
  const d = new Date(isoStr);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dias = Math.round(min / 1440);
  return dias === 1 ? 'ontem' : `${dias} dias`;
};
