import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { update, marcarPresenca, toast, notify } from '../../data/store';
import { addDays, aulasDoAluno, curta, freq, fromIso, iso, MES, presencas, semanasSeguidas, today, WD, br, grupoDe, metaDe, grausTxt, proximaFaixa, aulaById, valorDe, brl, mesAtual } from '../../data/util';
import { Sub, Chip, Bars, Overline, Belt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { LogoOseki } from '../../ui/brand';
import { go } from '../../ui/router';
import { planoNome } from '../../data/seed';
import { validarQR } from '../shared/qr';
import { useMe } from './common';

/* E02 · Permissão de localização */
export function Permissao() {
  const { me } = useMe();
  const permitir = () => {
    if (!('geolocation' in navigator)) { toast('Este aparelho não tem GPS. Marque a presença manualmente.'); go('aluno/inicio'); return; }
    navigator.geolocation.getCurrentPosition(
      () => { update((d) => { d.students.find((x) => x.id === me.id)!.geoAuto = true; }); toast('Presença automática ativada. Oss!'); go('aluno/inicio'); },
      () => { toast('Sem permissão. Você pode ativar depois no Perfil.'); go('aluno/inicio'); },
      { timeout: 15000 },
    );
  };
  const agoraNao = () => { update((d) => { d.students.find((x) => x.id === me.id)!.geoAuto = false; }); go('aluno/inicio'); };
  return (
    <div className="scroll">
      <div className="os-tatame os-tatame--brand hero" style={{ alignItems: 'center', paddingBottom: 36 }}>
        <div style={{ width: 168, height: 168, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', color: '#1E3248', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="pin" size={34} /></div>
          <span style={{ position: 'absolute', bottom: -10, background: '#fff', color: '#121A24', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px' }}>raio de 100 m</span>
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 24, gap: 16 }}>
        <span className="t-display-md">Presença automática</span>
        <p className="t-body muted" style={{ margin: 0 }}>Chegou no tatame, a presença está registrada. Sem fila, sem caderno.</p>
        {['Funciona só dentro do raio da academia.', 'Só no horário das suas aulas. Fora dele, nada é registrado.', 'Dá para desligar a qualquer momento no Perfil.'].map((t, i) => (
          <div key={i} className="row"><span style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--info-soft)', color: 'var(--brand-ink)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span><span className="t-body">{t}</span></div>
        ))}
        <button className="os-btn os-btn--primary os-btn--block" onClick={permitir}>Permitir localização</button>
        <button className="os-btn os-btn--quiet os-btn--block" onClick={agoraNao}>Agora não, marco manualmente</button>
      </div>
    </div>
  );
}

/* E03 · Grade semanal */
export function Grade() {
  const { db, me } = useMe();
  const start = addDays(today(), -today().getDay());
  const [dia, setDia] = useState(today().getDay());
  const aulas = db.aulas.filter((a) => a.dias.includes(dia)).sort((a, b) => a.ini.localeCompare(b.ini));
  const minhas = new Set(aulasDoAluno(db, me).map((a) => a.id));
  return (
    <Sub title="Grade semanal" sub="Aulas da academia" fallback="aluno/inicio">
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 4 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(start, i);
          const on = dia === i;
          return (
            <button key={i} aria-pressed={on} onClick={() => setDia(i)} style={{ height: 58, borderRadius: 14, border: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--surface)' : 'var(--ink)', outline: iso(d) === iso(today()) && !on ? '2px solid var(--ponteira)' : undefined }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{WD[i]}</span><span style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      {aulas.length === 0 && <div className="empty"><span className="t-small muted">Sem aulas neste dia.</span></div>}
      {aulas.map((a) => (
        <div key={a.id} className="os-card os-card--flat row" style={{ flexDirection: 'row', borderLeft: minhas.has(a.id) ? '4px solid var(--brand)' : undefined }}>
          <div className="col center" style={{ width: 52 }}><span style={{ fontWeight: 700 }}>{a.ini}</span><span className="t-sub">{a.fim}</span></div>
          <div className="grow col"><span style={{ fontWeight: 700 }}>{a.nome}</span><span className="t-sub">{a.prof} · {a.publico}</span></div>
          {a.id === me.turma && <Chip tone="info">Minha turma</Chip>}
        </div>
      ))}
    </Sub>
  );
}

/* E04 · Check-in por QR Code */
export function QRCheckin() {
  const { db, me } = useMe();
  const video = useRef<HTMLVideoElement>(null);
  const [cam, setCam] = useState<'off' | 'on' | 'erro'>('off');
  const [done, setDone] = useState<string | null>(null);
  const hoje = iso(today());

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stop) return;
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        setCam('on');
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        const tick = () => {
          if (stop) return;
          if (v.videoWidth) {
            c.width = 360; c.height = Math.round((v.videoHeight / v.videoWidth) * 360);
            ctx.drawImage(v, 0, 0, c.width, c.height);
            const code = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
            if (code?.data) {
              const r = validarQR(code.data, db.settings.codigo, hoje);
              if (r.ok) { confirmar(r.classId); return; }
              toast(r.erro);
            }
          }
          raf = window.setTimeout(tick, 250);
        };
        tick();
      } catch { setCam('erro'); }
    })();
    return () => { stop = true; clearTimeout(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function confirmar(classId: string) {
    marcarPresenca(me.id, classId, hoje, 'qr');
    setDone(classId);
  }
  if (done) {
    const a = aulaById(db, done);
    const rec = db.att.find((x) => x.sid === me.id && x.date === hoje && x.classId === done);
    return (
      <Sub title="Check-in" fallback="aluno/inicio">
        <div className="empty" style={{ padding: '40px 20px', gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="check" size={36} sw={2.6} /></div>
          <span className="t-display-sm">{rec?.status === 'ok' ? 'Presença confirmada' : 'Enviada para aprovação'}</span>
          <span className="t-small muted">{a?.nome} · {curta(today())} · {a?.ini}</span>
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => go('aluno/inicio')}>Voltar ao início</button>
        </div>
      </Sub>
    );
  }
  return (
    <Sub title="Check-in" sub="QR Code do tatame" fallback="aluno/inicio">
      <div className="scanner">
        <video ref={video} playsInline muted />
        {cam !== 'on' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center', fontSize: 14 }}>{cam === 'erro' ? 'Câmera indisponível. Permita o uso da câmera nas configurações do aparelho ou marque a presença manualmente.' : 'Abrindo a câmera…'}</div>}
        <div className="frame" />
      </div>
      <span className="t-title center" style={{ textAlign: 'center' }}>Aponte para o QR Code do tatame</span>
      <span className="t-small muted" style={{ textAlign: 'center' }}>O professor exibe o código no início da aula. Ideal para quem está sem GPS.</span>
    </Sub>
  );
}

/* E06 · Evolução */
export function Evolucao() {
  const { db, me } = useMe();
  const ano = today().getFullYear();
  const doAno = presencas(db, me.id, new Date(ano, 0, 1), today());
  const horas = doAno.reduce((h, x) => { const a = aulaById(db, x.classId); if (!a) return h; const [h1, m1] = a.ini.split(':').map(Number); const [h2, m2] = a.fim.split(':').map(Number); return h + (h2 * 60 + m2 - h1 * 60 - m1) / 60; }, 0);
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(ano, today().getMonth() - 5 + i, 1); const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0); return { l: MES[d.getMonth()], v: presencas(db, me.id, d, fim < today() ? fim : today()).length }; });
  const porAula: Record<string, number> = {};
  doAno.forEach((x) => { const n = aulaById(db, x.classId)?.nome ?? '—'; porAula[n] = (porAula[n] ?? 0) + 1; });
  const total = doAno.length || 1;
  const seq = semanasSeguidas(db, me.id);
  return (
    <Sub title="Evolução" sub="Seu treino em números" fallback="aluno/inicio">
      <div className="os-card os-card--night row" style={{ flexDirection: 'row', padding: 18 }}>
        <Icon n="flame" size={34} style={{ color: 'var(--fundador)' }} />
        <div className="col"><span className="t-stat" style={{ fontSize: 40 }}>{seq}</span><span className="os-muted t-small">semanas seguidas treinando</span></div>
      </div>
      <div className="grid-3">
        {[[doAno.length, `aulas em ${ano}`], [`${Math.round(horas)} h`, 'no tatame'], [`${freq(db, me)}%`, 'frequência']].map(([v, l]) => (
          <div key={l as string} className="os-stat" style={{ padding: 12 }}><span className="os-stat__value" style={{ fontSize: 26 }}>{v}</span><span className="os-stat__label">{l}</span></div>
        ))}
      </div>
      <div className="os-card">
        <div className="row-between"><span className="t-title">Aulas por mês</span><span className="t-sub">{MES[today().getMonth()]} até dia {today().getDate()}</span></div>
        <Bars data={meses} hl={5} />
      </div>
      <div className="os-card">
        <span className="t-title">Por aula</span>
        {Object.entries(porAula).sort((a, b) => b[1] - a[1]).map(([n, v]) => (
          <div key={n} className="col" style={{ gap: 6 }}>
            <div className="row-between t-small"><span>{n}</span><span className="t-strong">{Math.round((v / total) * 100)}%</span></div>
            <div className="os-bar"><div className="os-bar__fill" style={{ width: `${(v / total) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Sub>
  );
}

/* E07 · Biblioteca de técnicas */
const ORDEM = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
export function Tecnicas() {
  const { db, me } = useMe();
  const cats = ['Todas', ...Array.from(new Set(db.tecnicas.map((t) => t.cat)))];
  const [cat, setCat] = useState('Todas');
  const [aberta, setAberta] = useState<string | null>(null);
  const liberado = db.settings.conteudo['Biblioteca de técnicas']?.[me.plano] ?? true;
  const nivel = ORDEM.indexOf(grupoDe(me) === 'Adulto' ? me.belt : 'Branca');
  const semana = db.tecnicas.find((t) => t.semana);
  const lista = db.tecnicas.filter((t) => !t.semana && (cat === 'Todas' || t.cat === cat));
  return (
    <Sub title="Técnicas" sub="Biblioteca da academia" fallback="aluno/inicio">
      {semana && (
        <div className="os-card os-card--night" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 150, background: 'linear-gradient(135deg, #1E3248, #121A24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {semana.video ? <a href={semana.video} target="_blank" rel="noreferrer" aria-label="Assistir vídeo" style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon n="play" /></a> : <span style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="play" /></span>}
          </div>
          <div className="col-2" style={{ padding: '14px 18px 18px' }}>
            <span className="os-overline" style={{ color: 'var(--on-night-muted)' }}>Posição da semana{semana.dur ? ` · ${semana.dur}` : ''}</span>
            <span className="t-display-sm">{semana.titulo}</span>
            <span className="t-small os-muted">{semana.desc}</span>
          </div>
        </div>
      )}
      <div className="scroll-x">{cats.map((c) => <button key={c} className="os-pill" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div>
      {!liberado && <div className="os-card os-card--flat row" style={{ flexDirection: 'row', background: 'var(--info-soft)' }}><Icon n="lock" /><span className="t-small grow">A biblioteca completa faz parte dos planos mensais. <button className="link" onClick={() => go('aluno/x/planos')}>Ver planos</button></span></div>}
      <div className="os-list">
        {lista.map((t) => {
          const bloq = !liberado || ORDEM.indexOf(t.faixaMin) > nivel;
          const nv = me.tecnicas[t.id] ?? 0;
          return (
            <div key={t.id}>
              <button className="os-listrow" style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', cursor: 'pointer', opacity: bloq ? 0.55 : 1 }} onClick={() => bloq ? toast(`Liberada a partir da faixa ${t.faixaMin.toLowerCase()}.`) : setAberta(aberta === t.id ? null : t.id)}>
                <span className="ic-box" style={{ width: 40, height: 40 }}><Icon n={bloq ? 'lock' : 'play'} size={18} /></span>
                <span className="os-listrow__body"><span className="os-listrow__title">{t.titulo}</span><span className="os-listrow__meta">{t.cat} · faixa {t.faixaMin.toLowerCase()}{t.dur ? ` · ${t.dur}` : ''}</span></span>
                {nv === 2 ? <Chip tone="success">Aprovada</Chip> : nv === 1 ? <Chip tone="warning">Em treino</Chip> : null}
              </button>
              {aberta === t.id && <div className="t-small muted" style={{ padding: '10px 0 14px' }}>{t.desc}{t.video && <a className="os-btn os-btn--secondary os-btn--sm" style={{ marginTop: 8 }} href={t.video} target="_blank" rel="noreferrer"><Icon n="play" size={16} />Assistir vídeo</a>}</div>}
            </div>
          );
        })}
      </div>
    </Sub>
  );
}

/* E08 · Exame de faixa */
export function Exame() {
  const { db, me } = useMe();
  const meta = metaDe(db, me);
  const nf = me.graus < 4 ? `${me.graus + 1}º grau` : `Faixa ${(proximaFaixa(me) ?? me.belt).toLowerCase()}`;
  const ex = db.settings.proximoExame ? fromIso(db.settings.proximoExame) : null;
  const reqs = [
    { t: `${meta} aulas na faixa`, d: `${Math.min(me.aulas, meta)} de ${meta}`, ok: me.aulas >= meta },
    { t: 'Frequência acima de 70%', d: `${freq(db, me)}% nos últimos 30 dias`, ok: freq(db, me) >= 70 },
    ...db.tecnicas.filter((t) => ['t1', 't2', 't3', 't4', 't5', 't6'].includes(t.id)).map((t) => ({ t: t.titulo, d: (me.tecnicas[t.id] ?? 0) === 2 ? 'aprovada pelo professor' : (me.tecnicas[t.id] ?? 0) === 1 ? 'em treino' : 'ainda não avaliada', ok: (me.tecnicas[t.id] ?? 0) === 2 })),
  ];
  return (
    <Sub title="Exame de faixa" sub={`${me.belt} · ${grausTxt(me.graus)}`} fallback="aluno/faixa">
      <div className="os-card os-card--night" style={{ padding: 18 }}>
        <Belt belt={me.belt} graus={me.graus} />
        <div className="row-between"><div className="col"><span className="os-muted t-small">Próximo passo</span><span style={{ fontWeight: 700, fontSize: 17 }}>{nf}</span></div>
          <div className="col" style={{ alignItems: 'flex-end' }}><span className="os-muted t-small">Próximo exame</span><span style={{ fontWeight: 700 }}>{ex ? curta(ex) : 'A definir'}</span></div></div>
        {me.apto && <span className="os-chip os-chip--success" style={{ alignSelf: 'flex-start' }}>Você está apto. Oss!</span>}
      </div>
      <Overline>Requisitos</Overline>
      <div className="os-list">
        {reqs.map((r, i) => (
          <div key={i} className="os-listrow">
            <span style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: r.ok ? 'var(--success-soft)' : 'var(--surface-sunken)', color: r.ok ? 'var(--success)' : 'var(--ink-subtle)', border: r.ok ? 0 : '1.5px dashed var(--line-strong)' }}>{r.ok && <Icon n="check" size={14} sw={3} />}</span>
            <span className="os-listrow__body"><span className="os-listrow__title">{r.t}</span><span className="os-listrow__meta">{r.d}</span></span>
          </div>
        ))}
      </div>
      <span className="t-sub" style={{ padding: '0 4px' }}>As técnicas são marcadas pelo professor durante as aulas. A decisão final da graduação é sempre dele.</span>
    </Sub>
  );
}

/* E09 · Carteirinha */
export function Carteirinha() {
  const { db, me } = useMe();
  const turma = aulaById(db, me.turma);
  const share = async () => {
    const txt = `${me.nome} · ${db.settings.academia} · faixa ${me.belt.toLowerCase()} · matrícula ${me.matricula}`;
    if (navigator.share) { try { await navigator.share({ title: 'Carteirinha Oseki BJJ', text: txt }); } catch { /* cancelado */ } }
    else { await navigator.clipboard?.writeText(txt); toast('Dados copiados.'); }
  };
  return (
    <Sub title="Carteirinha" sub="Identificação de atleta" fallback="aluno/perfil">
      <div className="idcard os-tatame" style={{ borderRadius: 22 }}>
        <div className="row-between">
          <span style={{ color: '#fff' }}><LogoOseki width={64} /></span>
          <span className="os-seal" style={{ background: 'var(--fundador)', color: '#121A24' }}>Atleta</span>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div className="os-avatar os-avatar--lg" style={{ ['--ring' as string]: '#fff', background: '#1E3248' }}>{me.foto ? <img src={me.foto} alt="" /> : me.nome.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
          <div className="col"><span style={{ fontSize: 19, fontWeight: 700 }}>{me.nome}</span><span className="os-tatame__sub">{db.settings.equipe}</span><span className="os-tatame__sub">{turma?.nome}</span></div>
        </div>
        <Belt belt={me.belt} graus={me.graus} />
        <div className="grid-2" style={{ gap: 10 }}>
          {[['Matrícula', me.matricula], ['Desde', me.desde], ['Faixa', me.belt], ['Validade', `12/${today().getFullYear()}`]].map(([k, v]) => (
            <div key={k} className="col"><span className="os-overline" style={{ color: 'var(--on-night-muted)' }}>{k}</span><span className={k === 'Matrícula' ? 't-mono' : ''} style={{ fontWeight: 700 }}>{v}</span></div>
          ))}
        </div>
      </div>
      <span className="t-small muted" style={{ textAlign: 'center' }}>Apresente na entrada de campeonatos, seminários e academias parceiras.</span>
      <div className="grid-2">
        <button className="os-btn os-btn--secondary" onClick={share}><Icon n="share" size={18} />Compartilhar</button>
        <button className="os-btn os-btn--primary" onClick={() => window.print()}>Salvar / imprimir</button>
      </div>
    </Sub>
  );
}

/* E10 · Mensalidade */
export function Mensalidade() {
  const { db, me } = useMe();
  const [copiado, setCopiado] = useState(false);
  const mes = today();
  const valor = valorDe(db, me);
  const pix = db.settings.chavePix;
  const venc = db.settings.vencimento || 15;
  const status = me.pay === 'pago' ? { tone: 'success' as const, t: 'Pago' } : me.pay === 'analise' ? { tone: 'info' as const, t: 'Em análise' } : me.pay === 'atraso' ? { tone: 'danger' as const, t: `Em atraso · ${me.payDias ?? 0} dias` } : { tone: 'warning' as const, t: 'Em aberto' };
  const copiar = async () => { try { await navigator.clipboard.writeText(pix); setCopiado(true); toast('Chave Pix copiada.'); } catch { toast('Copie a chave manualmente.'); } };
  const paguei = () => { update((d) => { const s = d.students.find((x) => x.id === me.id)!; s.payInformado = mesAtual(); notify(d, 'prof', `${s.nome} informou pagamento`, `${brl(valor)} · confira o Pix e confirme no Financeiro.`, 'pay'); }); toast('Pagamento informado. A academia vai confirmar.'); };
  return (
    <Sub title="Mensalidade" sub={planoNome(me.plano)} fallback="aluno/perfil">
      <div className="os-card" style={{ padding: 18 }}>
        <div className="kv" style={{ padding: '0 0 12px' }}><span>Plano</span><span>{planoNome(me.plano)}{aulaById(db, me.turma) ? ` · ${aulaById(db, me.turma)?.nome}` : ''}</span></div>
        <div className="row-between"><div className="col"><span className="t-small muted" style={{ textTransform: 'capitalize' }}>{mes.toLocaleDateString('pt-BR', { month: 'long' })} · vence dia {venc}</span><span className="t-stat">{brl(valor)}</span></div><Chip tone={status.tone}>{status.t}</Chip></div>
        {me.fundador && me.plano !== 'avulso' && <span className="os-seal os-seal--fundador" style={{ alignSelf: 'flex-start' }}>Fundador · {db.settings.fundadorDesconto}% off</span>}
      </div>
      {me.pay !== 'pago' && (
        <div className="os-card" style={{ padding: 18 }}>
          <span className="t-title">Pagar com Pix</span>
          {pix ? (
            <>
              <span className="os-field__label">Chave Pix da academia</span>
              <div className="t-mono" style={{ background: 'var(--surface-sunken)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 12, fontSize: 13, wordBreak: 'break-all' }}>{pix}</div>
              <button className="os-btn os-btn--primary" onClick={copiar}><Icon n="copy" size={18} />{copiado ? 'Copiada' : 'Copiar chave Pix'}</button>
            </>
          ) : <span className="t-small muted">A academia ainda não cadastrou a chave Pix. Pague na recepção.</span>}
          {me.pay !== 'analise' && <button className="os-btn os-btn--secondary" onClick={paguei}>Já paguei</button>}
        </div>
      )}
      <Overline>Histórico</Overline>
      <div className="os-list">
        {(me.pagamentos ?? []).length === 0 && <div className="os-listrow"><span className="t-small muted">Nenhum pagamento registrado ainda.</span></div>}
        {(me.pagamentos ?? []).map((h) => { const [y, m] = h.mes.split('-').map(Number); return (
          <div key={h.mes} className="os-listrow"><span className="os-listrow__body"><span className="os-listrow__title" style={{ textTransform: 'capitalize' }}>{new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span><span className="os-listrow__meta">pago em {h.data} · {h.via} · {brl(h.valor)}</span></span><Chip tone="success">Pago</Chip></div>); })}
      </div>
    </Sub>
  );
}

/* E11 · Regras e pontuação */
export function Regras() {
  const pts = [['Queda', 2], ['Raspagem', 2], ['Joelho na barriga', 2], ['Passagem de guarda', 3], ['Montada', 4], ['Pegada pelas costas', 4]];
  const cod = [['Higiene', 'Kimono limpo, unhas cortadas e chinelo fora do tatame.'], ['Respeito', 'Cumprimente o professor e os parceiros. Oss!'], ['Segurança', 'Bateu, soltou. Sem golpes proibidos para a sua faixa.'], ['Pontualidade', 'Chegue antes do aquecimento. Atrasou, peça licença.'], ['Tatame', 'Sem calçados, sem comida e sem celular durante a aula.']];
  return (
    <Sub title="Regras" sub="Pontuação e código do tatame" fallback="aluno/perfil">
      <Overline>Pontuação IBJJF</Overline>
      <div className="os-list">
        {pts.map(([l, v]) => <div key={l as string} className="os-listrow"><span className="grow os-listrow__title">{l}</span><span className="t-stat" style={{ fontSize: 24 }}>{v}</span><span className="t-sub">pts</span></div>)}
      </div>
      <Overline>Código do tatame</Overline>
      <div className="os-list">
        {cod.map(([t, d], i) => <div key={t} className="os-listrow"><span className="t-stat" style={{ fontSize: 22, width: 24 }}>{i + 1}</span><span className="os-listrow__body"><span className="os-listrow__title">{t}</span><span className="os-listrow__meta">{d}</span></span></div>)}
      </div>
      <a className="os-btn os-btn--secondary" href="https://ibjjf.com/books-videos" target="_blank" rel="noreferrer">Abrir livro de regras IBJJF</a>
    </Sub>
  );
}
