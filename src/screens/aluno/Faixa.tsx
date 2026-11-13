import { grausTxt, metaDe, pct } from '../../data/util';
import { nextStep } from '../../data/store';
import { Belt, Chip, LinkCard, Overline } from '../../ui/kit';
import { go } from '../../ui/router';
import { useMe } from './common';

export default function Faixa() {
  const { db, me } = useMe();
  const meta = metaDe(db, me);
  return (
    <div className="scroll">
      <div className="os-tatame os-tatame--brand hero">
        <span className="t-display-md">Minha faixa</span>
        <Belt belt={me.belt} graus={me.graus} size="lg" />
        <div className="col" style={{ gap: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{me.belt}</span>
          <span className="t-small on-night-muted">{grausTxt(me.graus)} · graduado por Prof. Marangoni</span>
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 18 }}>
        <div className="os-card" style={{ padding: 18 }}>
          <div className="row-between"><span style={{ fontSize: 15, fontWeight: 700 }}>Caminho para o {nextStep(me)}</span><span className="num" style={{ fontSize: 13, fontWeight: 700 }}>{Math.min(me.aulas, meta)}/{meta}</span></div>
          <div className="os-bar" style={{ height: 10 }}><div className="os-bar__fill" style={{ width: `${pct(me.aulas, meta)}%` }} /></div>
          <div className="row-between" style={{ paddingTop: 4 }}>
            <span className="t-small muted">Avaliação técnica</span>
            {me.apto ? <Chip tone="success">Apto para exame</Chip> : me.aulas >= meta ? <Chip tone="info">Meta batida · aguarde o professor</Chip> : <Chip tone="neutral">Faltam {meta - me.aulas} aulas</Chip>}
          </div>
        </div>
        <LinkCard icon="star" title="Exame de faixa" sub="Requisitos e próxima data" onClick={() => go('aluno/x/exame')} />
        <LinkCard icon="card" title="Carteirinha" sub="Sua identificação de atleta" onClick={() => go('aluno/x/carteirinha')} />

        <Overline>Anotações do professor</Overline>
        {me.notes.length === 0 && <div className="os-card os-card--flat"><span className="t-small muted">Nenhuma anotação ainda.</span></div>}
        {me.notes.map((n, i) => (
          <div key={i} className="os-card" style={{ borderRadius: 18, gap: 8 }}>
            <div className="row-between t-sub"><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{n.by}</span><span>{n.d}</span></div>
            <p className="t-body" style={{ margin: 0 }}>{n.t}</p>
          </div>
        ))}

        <Overline>Histórico</Overline>
        <div className="os-list" style={{ borderRadius: 18 }}>
          {me.hist.map((h, i) => <div key={i} className="kv" style={{ fontSize: 13, padding: '12px 0' }}><span style={{ color: 'var(--ink)' }}>{h.t}</span><span style={{ color: 'var(--ink-subtle)', fontWeight: 400 }}>{h.d}</span></div>)}
        </div>
      </div>
    </div>
  );
}
