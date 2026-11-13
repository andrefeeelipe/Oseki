import { useState } from 'react';
import { update, toast, notify } from '../../data/store';
import { PLANOS, planoNome } from '../../data/seed';
import type { PlanoId } from '../../data/types';
import { Sub, Chip, Switch } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { useMe } from './common';
import { addDays, br, today } from '../../data/util';

export function Planos() {
  const { db, me } = useMe();
  const set = db.settings;
  const usados = db.students.filter((s) => s.fundador).length;
  const vagas = Math.max(0, set.fundadorVagas - usados);
  const [plan, setPlan] = useState<PlanoId>(me.plano === 'avulso' ? 'trimestral' : me.plano);
  const [feito, setFeito] = useState(false);
  const p = PLANOS.find((x) => x.id === plan)!;
  const viraFundador = plan !== 'avulso' && !me.fundador && vagas > 0;

  const contratar = () => {
    update((d) => {
      const s = d.students.find((x) => x.id === me.id)!;
      s.plano = plan;
      if (plan !== 'avulso' && !s.fundador && vagas > 0) s.fundador = Math.max(0, ...d.students.map((x) => x.fundador ?? 0)) + 1;
      const fim = addDays(today(), (p.meses || 1) * 30);
      s.contrato = { assinado: false, vig: `até ${br(fim)}`, renova: plan !== 'avulso', status: 'assin' };
      s.pay = 'aberto';
      notify(d, 'prof', `${s.nome} contratou o plano ${p.nome.toLowerCase()}`, 'Contrato aguardando assinatura do aluno.', 'info');
    });
    setFeito(true);
  };

  if (feito) {
    const n = db.students.find((x) => x.id === me.id)?.fundador;
    return (
      <Sub title="Planos" sub="Escolha como quer treinar" fallback="aluno/perfil">
        <div className="empty" style={{ padding: '30px 22px', gap: 12, marginTop: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--night)', color: 'var(--fundador)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 26px var(--font-display)' }}>{plan === 'avulso' ? <Icon n="check" size={30} /> : `#${n ?? '—'}`}</div>
          <span className="t-display-sm" style={{ fontSize: 30 }}>{plan === 'avulso' ? 'Aula avulsa comprada' : n ? 'Bem-vindo, fundador!' : 'Plano contratado!'}</span>
          <span className="t-body muted">{plan === 'avulso' ? 'Sua entrada está liberada para 1 aula. Falta só assinar o contrato.' : n ? `Você é o aluno fundador nº ${n} no plano ${p.nome.toLowerCase()}. Pague em dia para manter os ${set.fundadorDesconto}% de desconto.` : `Plano ${p.nome.toLowerCase()} ativo. Falta assinar o contrato.`}</span>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => go('aluno/x/contrato')}>Ler e assinar contrato</button>
          <button className="os-btn os-btn--quiet" onClick={() => setFeito(false)}>Escolher outro plano</button>
        </div>
      </Sub>
    );
  }

  return (
    <Sub title="Planos" sub="Escolha como quer treinar" fallback="aluno/perfil">
      {!me.fundador && (
        <div className="os-card os-card--night" style={{ padding: '16px 18px', gap: 10 }}>
          <div className="row-between"><span className="os-overline" style={{ color: 'var(--fundador)' }}>Aluno fundador</span><span style={{ fontSize: 13, fontWeight: 700 }}>{vagas} vagas restantes</span></div>
          <span style={{ fontSize: 15, lineHeight: 1.45 }}>Os {set.fundadorVagas} primeiros a fechar um plano ganham <strong>{set.fundadorDesconto}% de desconto</strong> enquanto pagarem em dia.</span>
          <div className="os-bar" style={{ background: 'rgba(255,255,255,0.15)' }}><div className="os-bar__fill os-bar__fill--fundador" style={{ width: `${(usados / set.fundadorVagas) * 100}%` }} /></div>
        </div>
      )}
      {PLANOS.map((x) => {
        const on = plan === x.id;
        return (
          <button key={x.id} onClick={() => setPlan(x.id)} aria-pressed={on} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, cursor: 'pointer', background: 'var(--surface)', border: `2px solid ${on ? 'var(--brand-ink)' : 'transparent'}`, color: 'var(--ink)', textAlign: 'left' }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${on ? 'var(--brand-ink)' : 'var(--switch-off)'}` }}><span style={{ width: 10, height: 10, borderRadius: 5, background: on ? 'var(--brand-ink)' : 'transparent' }} /></span>
            <span className="grow col" style={{ gap: 3 }}>
              <span className="row" style={{ gap: 8 }}><span style={{ fontSize: 16, fontWeight: 700 }}>{x.nome}</span>{x.id === 'anual' && <span className="os-seal os-seal--destaque">Melhor valor</span>}{me.plano === x.id && <Chip tone="info">Atual</Chip>}</span>
              <span className="t-sub">{x.desc}</span>
            </span>
            <span className="col" style={{ alignItems: 'flex-end' }}><span style={{ fontSize: 15, fontWeight: 700 }}>R$ [VALOR]</span><span className="t-sub" style={{ fontSize: 11 }}>{x.per}</span></span>
          </button>
        );
      })}
      <span className="t-sub" style={{ padding: '0 4px', lineHeight: 1.5 }}>{plan === 'avulso' ? 'Avulso não participa do programa Aluno Fundador.' : viraFundador ? `Plano ${p.nome.toLowerCase()}: você entra como aluno fundador com ${set.fundadorDesconto}% de desconto.` : me.fundador ? `Você já é fundador #${me.fundador}: o desconto continua.` : `Plano ${p.nome.toLowerCase()}.`}</span>
      <button className="os-btn os-btn--primary os-btn--block" onClick={contratar}>Contratar plano {p.nome.toLowerCase()}</button>
    </Sub>
  );
}

export function Contrato() {
  const { db, me } = useMe();
  const set = db.settings;
  const s = me;
  const sw = (v: boolean) => { update((d) => { d.students.find((x) => x.id === me.id)!.contrato.renova = v; }); toast(v ? 'Renovação automática ligada.' : 'Renovação automática desligada.'); };
  const assinar = () => { update((d) => { const x = d.students.find((y) => y.id === me.id)!; x.contrato.assinado = true; x.contrato.status = 'ativo'; notify(d, 'prof', `${x.nome} assinou o contrato`, `Plano ${planoNome(x.plano).toLowerCase()}.`, 'ok'); }); toast('Contrato assinado. Cópia enviada por e-mail.'); };
  return (
    <Sub title="Meu plano" sub="Contrato e benefícios" fallback="aluno/perfil">
      {s.fundador ? (
        <div className="os-card os-card--night" style={{ padding: 18, gap: 12 }}>
          <div className="row-between"><span className="os-overline" style={{ color: 'var(--fundador)' }}>Aluno fundador #{s.fundador}</span><span style={{ fontSize: 12, fontWeight: 700, color: '#121A24', background: 'var(--fundador)', borderRadius: 8, padding: '4px 8px' }}>{set.fundadorDesconto}% OFF</span></div>
          <span style={{ fontSize: 15, lineHeight: 1.45 }}>{Math.min(12, s.mesesEmDia)} de 12 meses pagos em dia.{s.mesesEmDia < 12 ? ` Faltam ${12 - s.mesesEmDia} para o desconto ficar garantido.` : ' Desconto garantido!'}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 4 }}>{Array.from({ length: 12 }, (_, i) => <div key={i} style={{ height: 10, borderRadius: 3, background: i < s.mesesEmDia ? 'var(--fundador)' : 'rgba(255,255,255,0.18)' }} />)}</div>
          <span className="t-sub on-night-muted">Atraso acima de {set.fundadorTolerancia} dias faz perder o título de fundador.</span>
        </div>
      ) : null}
      <div className="os-list">
        <div className="kv"><span>Plano</span><span>{planoNome(s.plano)}</span></div>
        <div className="kv"><span>Vigência</span><span>{s.contrato.vig}</span></div>
        <div className="kv"><span>Próxima cobrança</span><span>15/{String(today().getMonth() + 2 > 12 ? 1 : today().getMonth() + 2).padStart(2, '0')} · R$ [VALOR]</span></div>
        <div className="setting"><div className="col"><span style={{ fontSize: 14, fontWeight: 600 }}>Renovação automática</span><span className="t-sub">Renova no fim da vigência</span></div><Switch on={s.contrato.renova} onChange={sw} label="Renovação automática" /></div>
      </div>
      <div className="os-card row" style={{ flexDirection: 'row', gap: 14 }}>
        <div style={{ width: 44, height: 54, borderRadius: 6, background: 'var(--surface-sunken)', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ink-muted)' }}><Icon n="doc" size={20} /></div>
        <div className="grow col"><span style={{ fontSize: 14, fontWeight: 700 }}>Contrato de matrícula</span><span style={{ fontSize: 12, color: s.contrato.assinado ? 'var(--success)' : 'var(--danger)' }}>{s.contrato.assinado ? 'Assinado' : 'Aguardando sua assinatura'}</span></div>
        {s.contrato.assinado ? <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => window.print()}>Ver PDF</button> : <button className="os-btn os-btn--primary os-btn--sm" onClick={assinar}>Assinar</button>}
      </div>
      <div className="os-card">
        <span style={{ fontSize: 14, fontWeight: 700 }}>O que seu plano libera</span>
        {Object.entries(set.conteudo).map(([t, m]) => {
          const ok = m[s.plano];
          return (
            <div key={t} className="row" style={{ gap: 10, fontSize: 13 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: ok ? 'var(--success-soft)' : 'var(--surface-sunken)', color: ok ? 'var(--success)' : 'var(--ink-muted)' }}>{ok ? <Icon n="check" size={13} sw={3} /> : '—'}</span>
              <span style={{ color: ok ? 'var(--ink)' : 'var(--ink-muted)' }}>{t}{ok ? '' : ' · plano superior'}</span>
            </div>
          );
        })}
        <button className="os-btn os-btn--secondary" onClick={() => go('aluno/x/planos')}>Mudar de plano</button>
      </div>
    </Sub>
  );
}
