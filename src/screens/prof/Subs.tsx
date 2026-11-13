import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useDB, update, toast, graduar, enviarAviso, nextStep, meuNome } from '../../data/store';
import { addDays, aulasDoDia, aulaById, curta, freq, grupoDe, iso, metaDe, presencas, today, WD, primeiro, uid } from '../../data/util';
import { Sub, Avatar, Bars, Chip, Overline, Setting, Field, Stepper, Belt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { SeloOseki } from '../../ui/brand';
import { go } from '../../ui/router';
import { PLANOS } from '../../data/seed';
import { qrPayload, slotNow } from '../shared/qr';
import { rosterDe } from './Chamada';

/* E12 · Painel do professor */
export function Painel() {
  const db = useDB();
  const ativos = db.students.filter((s) => s.status !== 'inativo');
  const media = Math.round(ativos.reduce((a, s) => a + freq(db, s), 0) / (ativos.length || 1));
  const ini = addDays(today(), -today().getDay());
  const semana = Array.from({ length: 7 }, (_, i) => { const d = addDays(ini, i); return { l: WD[d.getDay()], v: db.att.filter((x) => x.date === iso(d) && x.status === 'ok').length }; });
  const total = semana.reduce((a, b) => a + b.v, 0);
  const pend = db.att.filter((x) => x.status === 'pend').length;
  const atencao = ativos.map((s) => { const ult = presencas(db, s.id).map((x) => x.date).sort().pop(); const dias = ult ? Math.round((today().getTime() - new Date(ult + 'T00:00').getTime()) / 864e5) : 99; return { s, dias, f: freq(db, s) }; })
    .filter((x) => x.dias >= 7 || x.f < 65).sort((a, b) => b.dias - a.dias).slice(0, 4);
  const prontos = ativos.filter((s) => s.apto || s.aulas >= metaDe(db, s));
  return (
    <Sub title="Painel" sub="Resumo da academia" fallback="prof/mais" admin>
      <div className="grid-2">
        <button className="os-stat os-stat--night" style={{ border: 0, textAlign: 'left' }}><span className="os-stat__value">{ativos.length}</span><span className="os-stat__label">alunos ativos</span></button>
        <div className="os-stat"><span className="os-stat__value">{media}%</span><span className="os-stat__label">frequência média</span></div>
        <div className="os-stat"><span className="os-stat__value">{total}</span><span className="os-stat__label">presenças na semana</span></div>
        <button className={`os-stat ${pend ? 'os-stat--warning' : ''}`} style={{ border: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }} onClick={() => go('prof/aprovacoes')}><span className="os-stat__value">{pend}</span><span className="os-stat__label">aprovações pendentes</span></button>
      </div>
      <div className="os-card"><span className="t-title">Presenças por dia · esta semana</span><Bars data={semana} hl={today().getDay()} /></div>
      <Overline>Precisam de atenção</Overline>
      <div className="os-list">
        {atencao.length === 0 && <div className="os-listrow"><span className="t-small muted">Todos treinando em dia. Oss!</span></div>}
        {atencao.map(({ s, dias, f }) => (
          <div key={s.id} className="os-listrow">
            <Avatar s={s} />
            <span className="os-listrow__body"><span className="os-listrow__title">{s.nome}</span><span className="os-listrow__meta">{dias >= 7 ? `${dias} dias sem treinar` : `frequência caiu para ${f}%`}{s.pay === 'atraso' ? ' · mensalidade em atraso' : ''}</span></span>
            <a className="os-btn os-btn--secondary os-btn--sm" href={`https://wa.me/55${s.tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Oss, ${primeiro(s.nome)}! Sentimos sua falta no tatame.`)}`} target="_blank" rel="noreferrer">Mensagem</a>
          </div>
        ))}
      </div>
      <Overline>Prontos para graduar</Overline>
      <button className="card-link" onClick={() => go('prof/x/graduacao')}>
        <span className="row" style={{ gap: 0 }}>{prontos.slice(0, 4).map((s, i) => <span key={s.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar s={s} size={34} /></span>)}</span>
        <span className="grow t-small">{prontos.length ? prontos.slice(0, 2).map((s) => primeiro(s.nome)).join(' e ') + (prontos.length > 2 ? ` e mais ${prontos.length - 2}` : '') : 'Ninguém ainda'}</span>
        <Chip tone="success">{prontos.length} aptos</Chip>
      </button>
    </Sub>
  );
}

/* E14 · Graduação */
export function Graduacao() {
  const db = useDB();
  const cands = db.students.filter((s) => s.apto || s.aulas >= metaDe(db, s) - 2).sort((a, b) => Number(b.apto) - Number(a.apto));
  const [sel, setSel] = useState<string[]>(() => cands.filter((s) => s.apto).map((s) => s.id));
  const [feito, setFeito] = useState<string[] | null>(null);
  if (feito) return (
    <Sub title="Graduação" fallback="prof/mais" admin>
      <div className="empty" style={{ gap: 12, padding: '36px 20px' }}>
        <Icon n="belt" size={40} />
        <span className="t-display-sm">Graduação registrada</span>
        <span className="t-small muted">{feito.length} {feito.length === 1 ? 'aluno graduado' : 'alunos graduados'}. As faixas foram atualizadas no app e os alunos receberam uma notificação. Oss!</span>
        <button className="os-btn os-btn--primary os-btn--block" onClick={() => setFeito(null)}>Voltar à lista</button>
      </div>
    </Sub>
  );
  return (
    <Sub title="Graduação" sub="Cerimônia de faixas" fallback="prof/mais" admin>
      <span className="t-small muted" style={{ padding: '0 4px' }}>Selecione quem será graduado. A nova faixa ou grau aparece no app de cada aluno na hora.</span>
      {cands.length === 0 && <div className="empty"><span className="t-small muted">Nenhum aluno perto da meta.</span></div>}
      {cands.map((s) => {
        const on = sel.includes(s.id);
        const meta = metaDe(db, s);
        return (
          <button key={s.id} aria-pressed={on} onClick={() => setSel(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])} className="os-card" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', textAlign: 'left', color: 'var(--ink)', border: `2px solid ${on ? 'var(--brand-ink)' : 'transparent'}`, boxShadow: 'none' }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--brand)' : 'transparent', border: on ? 0 : '2px solid var(--switch-off)', color: '#fff' }}>{on && <Icon n="check" size={14} sw={3} />}</span>
            <Avatar s={s} />
            <span className="grow col" style={{ gap: 4 }}>
              <span style={{ fontWeight: 700 }}>{s.nome}</span>
              <span className="row" style={{ gap: 8 }}><span style={{ width: 40 }}><Belt belt={s.belt} graus={s.graus} size="sm" /></span><span className="t-sub">→ {nextStep(s)}</span></span>
            </span>
            <span className="col" style={{ alignItems: 'flex-end' }}><span className="num t-strong">{s.aulas}/{meta}</span>{s.apto && <Chip tone="success">Apto</Chip>}</span>
          </button>
        );
      })}
      <button className="os-btn os-btn--primary os-btn--block" disabled={!sel.length} onClick={() => { graduar(sel); setFeito(sel); setSel([]); }}>{sel.length ? `Graduar ${sel.length} ${sel.length === 1 ? 'aluno' : 'alunos'}` : 'Selecione os alunos'}</button>
    </Sub>
  );
}

/* E15 · Comunicado */
export function Comunicado() {
  const db = useDB();
  const [para, setPara] = useState('Todos');
  const [titulo, setTitulo] = useState('');
  const [msg, setMsg] = useState('');
  const [enviado, setEnviado] = useState<number | null>(null);
  const n = db.students.filter((s) => para === 'Todos' || grupoDe(s) === para).length;
  if (enviado != null) return (
    <Sub title="Comunicado" fallback="prof/mais" admin>
      <div className="empty" style={{ gap: 12 }}>
        <Icon n="checkCircle" size={40} style={{ color: 'var(--success)' }} />
        <span className="t-display-sm">Aviso enviado</span>
        <span className="t-small muted">{enviado} alunos receberam no app.</span>
        <button className="os-btn os-btn--primary os-btn--block" onClick={() => { setEnviado(null); setTitulo(''); setMsg(''); }}>Escrever outro</button>
      </div>
    </Sub>
  );
  return (
    <Sub title="Comunicado" sub="Aviso para os alunos" fallback="prof/mais" admin>
      <Overline>Para</Overline>
      <div className="scroll-x">{['Todos', 'Kids', 'Teens', 'Adulto'].map((g) => <button key={g} className="os-pill" aria-pressed={para === g} onClick={() => setPara(g)}>{g}</button>)}</div>
      <Field label="Título"><input className="os-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Sem aula no feriado" /></Field>
      <Field label="Mensagem"><textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva o aviso" /></Field>
      <Overline>Como o aluno vai ver</Overline>
      <div className="os-card os-card--flat row" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <span style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--info-soft)', color: 'var(--brand-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="megaphone" size={17} /></span>
        <span className="col"><span className="t-strong" style={{ fontSize: 14 }}>{titulo || 'Título do aviso'}</span><span className="t-sub">{msg || 'A mensagem aparece aqui.'}</span></span>
      </div>
      <button className="os-btn os-btn--primary os-btn--block" disabled={!titulo.trim() || !msg.trim()} onClick={() => { enviarAviso(para, titulo.trim(), msg.trim(), grupoDe); setEnviado(n); }}>Enviar para {n} alunos</button>
    </Sub>
  );
}

/* E13 · Área de presença (geolocalização) */
export function AreaGeo() {
  const db = useDB();
  const s = db.settings;
  const [busy, setBusy] = useState(false);
  const usarAqui = () => {
    if (!('geolocation' in navigator)) { toast('Sem GPS neste aparelho.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { update((d) => { d.settings.lat = p.coords.latitude; d.settings.lng = p.coords.longitude; }); setBusy(false); toast('Área da academia salva neste local.'); },
      () => { setBusy(false); toast('Permita a localização para marcar a área.'); },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  };
  return (
    <Sub title="Área de presença" sub="Check-in automático por GPS" fallback="prof/mais" admin>
      <div className="os-card os-tatame" style={{ borderRadius: 20, alignItems: 'center', padding: 28 }}>
        <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'rgba(31,107,61,0.25)', border: '2px solid #5CC48A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="pin" size={36} /></div>
        <span className="t-small on-night-muted" style={{ textAlign: 'center' }}>{s.academia} · {s.endereco}</span>
        <span className="t-mono" style={{ fontSize: 12 }}>{s.lat != null ? `${s.lat.toFixed(5)}, ${s.lng!.toFixed(5)}` : 'Local ainda não definido'}</span>
      </div>
      <button className="os-btn os-btn--primary os-btn--block" onClick={usarAqui} disabled={busy}><Icon n="pin" size={18} />{busy ? 'Obtendo localização…' : 'Usar minha localização atual'}</button>
      <span className="t-sub" style={{ padding: '0 4px' }}>Faça isso dentro da academia. Os alunos que chegarem no raio, no horário da aula, ficam presentes sozinhos.</span>
      <div className="os-card">
        <div className="row-between"><span className="t-title">Raio de presença</span><span className="t-stat" style={{ fontSize: 26 }}>{s.raio} m</span></div>
        <div className="seg">{[50, 100, 200, 300].map((r) => <button key={r} aria-pressed={s.raio === r} onClick={() => update((d) => { d.settings.raio = r; })}>{r} m</button>)}</div>
      </div>
      <div className="os-list">
        <div className="kv"><span>Janela de check-in</span><span>30 min antes até 15 min após o início</span></div>
        <Setting title="Revisar presenças por GPS" sub="Se ligado, o GPS também vai para aprovação" on={s.revisarGps} onChange={(v) => update((d) => { d.settings.revisarGps = v; })} />
      </div>
    </Sub>
  );
}

/* N2 · Dados da academia */
export function Academia() {
  const db = useDB();
  const s = db.settings;
  const admin = db.session?.role === 'admin';
  const [f, setF] = useState({ academia: s.academia, equipe: s.equipe, endereco: s.endereco, whatsapp: s.whatsapp, chavePix: s.chavePix ?? '', vencimento: s.vencimento ?? 15, proximoExame: s.proximoExame ?? '' });
  const [precos, setPrecos] = useState<Record<string, string>>(() => Object.fromEntries(PLANOS.map((p) => [p.id, s.precos?.[p.id] ? String(s.precos[p.id]).replace('.', ',') : ''])));
  const [cod, setCod] = useState({ codigo_aluno: db.segredos?.codigo_aluno ?? s.codigo, codigo_prof: db.segredos?.codigo_prof ?? '' });
  const salvar = () => {
    update((d) => {
      Object.assign(d.settings, { ...f, proximoExame: f.proximoExame || null, codigo: cod.codigo_aluno.trim().toUpperCase() });
      d.settings.precos = Object.fromEntries(PLANOS.map((p) => [p.id, Number((precos[p.id] || '0').replace(/\./g, '').replace(',', '.')) || 0])) as typeof d.settings.precos;
      if (d.segredos) d.segredos = { codigo_aluno: cod.codigo_aluno.trim().toUpperCase(), codigo_prof: cod.codigo_prof.trim().toUpperCase() };
    });
    toast('Dados da academia salvos.');
  };
  return (
    <Sub title="Academia" sub="Dados, valores e equipe" fallback="prof/mais" admin>
      <div className="os-card" style={{ alignItems: 'center' }}>
        <SeloOseki size={72} />
        <span className="t-title">{f.academia}</span><span className="t-sub">{f.equipe}</span>
      </div>
      <Field label="Nome"><input className="os-input" value={f.academia} onChange={(e) => setF({ ...f, academia: e.target.value })} /></Field>
      <Field label="Equipe"><input className="os-input" value={f.equipe} onChange={(e) => setF({ ...f, equipe: e.target.value })} /></Field>
      <Field label="Endereço"><input className="os-input" value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} placeholder="Rua, número, bairro, cidade" /></Field>
      <Field label="WhatsApp"><input className="os-input" inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
      <Field label="Data do próximo exame de faixa"><input className="os-input" type="date" value={f.proximoExame} onChange={(e) => setF({ ...f, proximoExame: e.target.value })} /></Field>

      <Overline>Valores dos planos (por mês)</Overline>
      <div className="os-list">
        {PLANOS.map((p) => (
          <div key={p.id} className="os-listrow">
            <span className="os-listrow__body"><span className="os-listrow__title">{p.nome}</span><span className="os-listrow__meta">{p.per}</span></span>
            <span className="t-sub">R$</span>
            <input className="os-input" style={{ width: 110, textAlign: 'right' }} inputMode="decimal" aria-label={`Valor do plano ${p.nome}`} placeholder="0,00" value={precos[p.id]} onChange={(e) => setPrecos({ ...precos, [p.id]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="grid-2">
        <Field label="Vencimento (dia do mês)"><input className="os-input" type="number" min={1} max={28} value={f.vencimento} onChange={(e) => setF({ ...f, vencimento: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
        <Field label="Desconto fundador"><input className="os-input" value={`${s.fundadorDesconto}%`} disabled /></Field>
      </div>
      <Field label="Chave Pix (aparece para o aluno pagar)"><input className="os-input os-input--code" value={f.chavePix} onChange={(e) => setF({ ...f, chavePix: e.target.value })} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" /></Field>

      <Overline>Códigos de cadastro</Overline>
      <div className="grid-2">
        <Field label="Código dos alunos"><input className="os-input os-input--code" value={cod.codigo_aluno} onChange={(e) => setCod({ ...cod, codigo_aluno: e.target.value.toUpperCase() })} /></Field>
        <Field label="Código de professor"><input className="os-input os-input--code" value={cod.codigo_prof} disabled={!admin} onChange={(e) => setCod({ ...cod, codigo_prof: e.target.value.toUpperCase() })} /></Field>
      </div>
      <span className="t-sub" style={{ padding: '0 4px' }}>O aluno usa o código dos alunos para criar a conta no app. O código de professor só deve ser passado para professores.</span>

      <button className="os-btn os-btn--primary os-btn--block" onClick={salvar}>Salvar dados</button>

      <Overline>Equipe</Overline>
      <div className="os-list">
        {db.profs.map((p) => (
          <div key={p.id} className="os-listrow">
            <Avatar s={{ nome: p.nome || 'Professor', belt: p.belt, foto: p.foto }} />
            <span className="os-listrow__body"><span className="os-listrow__title">{p.nome || 'Sem nome'}</span><span className="os-listrow__meta">Faixa {p.belt.toLowerCase()} · {p.role === 'admin' ? 'administrador' : 'professor'}</span></span>
            {admin && p.id !== db.session?.sid && <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => { update((d) => { const x = d.profs.find((y) => y.id === p.id)!; x.role = x.role === 'admin' ? 'prof' : 'admin'; }); toast('Permissão atualizada.'); }}>{p.role === 'admin' ? 'Tirar admin' : 'Tornar admin'}</button>}
          </div>
        ))}
      </div>
    </Sub>
  );
}

/* N3 · Gerenciar grade */
export function GerenciarGrade() {
  const db = useDB();
  const [dia, setDia] = useState(today().getDay());
  const aulas = aulasDoDia(db, addDays(today(), dia - today().getDay()));
  return (
    <Sub title="Grade" sub="Aulas da semana" fallback="prof/mais" admin>
      <div className="seg" style={{ gridAutoColumns: 'minmax(0,1fr)' }}>{WD.map((w, i) => <button key={w} aria-pressed={dia === i} onClick={() => setDia(i)}>{w}</button>)}</div>
      {aulas.length === 0 && <div className="empty"><span className="t-small muted">Sem aulas neste dia.</span></div>}
      {aulas.map((a) => (
        <button key={a.id} className="card-link" onClick={() => go(`prof/x/novaaula/${a.id}`)}>
          <span className="col center" style={{ width: 52 }}><span style={{ fontWeight: 700 }}>{a.ini}</span><span className="t-sub">{a.fim}</span></span>
          <span className="grow col"><span style={{ fontWeight: 700 }}>{a.nome}</span><span className="t-sub">{a.prof} · {a.vagas} vagas · {a.dias.map((d) => WD[d]).join(', ')}</span></span>
          <Icon n="edit" size={18} />
        </button>
      ))}
      <button className="os-btn os-btn--dashed os-btn--block" onClick={() => go('prof/x/novaaula')}><Icon n="plus" size={18} />Nova aula</button>
    </Sub>
  );
}

/* N4 · Nova aula / editar */
export function NovaAula({ id }: { id?: string }) {
  const db = useDB();
  const ex = id ? aulaById(db, id) : undefined;
  const [f, setF] = useState(() => ex ? { ...ex } : { id: '', nome: '', ini: '19:00', fim: '20:00', dias: [1, 3], publico: 'Adulto', prof: meuNome(db), vagas: 20, grupo: 'Adulto' as const });
  const salvar = () => {
    if (!f.nome.trim() || !f.dias.length) { toast('Informe o nome e pelo menos um dia.'); return; }
    update((d) => {
      const g = f.publico.startsWith('Kids') ? 'Kids' : f.publico.startsWith('Teens') ? 'Teens' : f.publico === 'Todos' ? 'Todos' : 'Adulto';
      const a = { ...f, grupo: g as typeof f.grupo, id: f.id || 'c' + uid() };
      const i = d.aulas.findIndex((x) => x.id === a.id);
      if (i >= 0) d.aulas[i] = a; else d.aulas.push(a);
    });
    toast(ex ? 'Aula atualizada.' : 'Aula criada na grade.');
    history.back();
  };
  return (
    <Sub title={ex ? 'Editar aula' : 'Nova aula'} fallback="prof/x/grade" admin>
      <Field label="Nome da aula"><input className="os-input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: No-Gi avançado" /></Field>
      <div className="grid-2">
        <Field label="Início"><input className="os-input" type="time" value={f.ini} onChange={(e) => setF({ ...f, ini: e.target.value })} /></Field>
        <Field label="Fim"><input className="os-input" type="time" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} /></Field>
      </div>
      <span className="os-field__label">Dias da semana</span>
      <div className="seg">{WD.map((w, i) => <button key={w} aria-pressed={f.dias.includes(i)} onClick={() => setF({ ...f, dias: f.dias.includes(i) ? f.dias.filter((x) => x !== i) : [...f.dias, i].sort() })}>{w}</button>)}</div>
      <span className="os-field__label">Público</span>
      <div className="scroll-x">{['Kids 4–10', 'Teens 11–15', 'Adulto', 'Todos'].map((p) => <button key={p} className="os-pill" aria-pressed={f.publico === p} onClick={() => setF({ ...f, publico: p })}>{p}</button>)}</div>
      <span className="os-field__label">Professor</span>
      <div className="scroll-x">{db.profs.map((x) => x.nome).filter(Boolean).map((p) => <button key={p} className="os-pill" aria-pressed={f.prof === p} onClick={() => setF({ ...f, prof: p })}>{p}</button>)}</div>
      <div className="os-card os-card--flat row-between" style={{ flexDirection: 'row' }}><span className="t-strong">Vagas</span><Stepper v={f.vagas} set={(v) => setF({ ...f, vagas: v })} min={1} label="vagas" /></div>
      <button className="os-btn os-btn--primary os-btn--block" onClick={salvar}>{ex ? 'Salvar alterações' : 'Criar aula'}</button>
      {ex && <button className="os-btn os-btn--danger" onClick={() => { if (confirm('Excluir esta aula da grade?')) { update((d) => { d.aulas = d.aulas.filter((x) => x.id !== ex.id); }); toast('Aula excluída.'); history.back(); } }}>Excluir aula</button>}
    </Sub>
  );
}

/* N5 · QR Code da aula */
export function QRAula({ classId }: { classId?: string }) {
  const db = useDB();
  const hoje = iso(today());
  const a = aulaById(db, classId ?? '') ?? aulasDoDia(db, today())[0] ?? db.aulas[0];
  const [img, setImg] = useState('');
  const [slot, setSlot] = useState(slotNow());
  const [left, setLeft] = useState(30);
  useEffect(() => {
    const t = setInterval(() => { const s = slotNow(); setSlot(s); setLeft(30 - Math.floor((Date.now() / 1000) % 30)); }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { QRCode.toDataURL(qrPayload(db.settings.codigo, a.id, hoje, slot), { margin: 1, width: 520, color: { dark: '#121A24', light: '#FFFFFF' } }).then(setImg); }, [slot, a.id, hoje, db.settings.codigo]);
  const presentes = new Set(db.att.filter((x) => x.date === hoje && x.classId === a.id && x.status === 'ok').map((x) => x.sid)).size;
  const total = rosterDe(db, a).length;
  return (
    <div className="scroll os-tatame" style={{ borderRadius: 0, padding: 0, gap: 0 }}>
      <div className="subhead"><button className="back" aria-label="Voltar" onClick={() => history.back()}><Icon n="back" size={18} /></button><span className="grow" /><span className="os-seal" style={{ background: '#fff', color: '#121A24' }}>Admin</span></div>
      <div className="pad" style={{ alignItems: 'center', textAlign: 'center' }}>
        <span className="os-overline" style={{ color: 'var(--on-night-muted)' }}>Check-in · {curta(today())}</span>
        <span className="t-display-md">{a.nome} · {a.ini}</span>
        <div className="qr-box" style={{ width: '100%' }}>{img && <img src={img} alt="QR Code de check-in da aula" />}</div>
        <span className="t-small on-night-muted">O código muda a cada 30 s para evitar fotos compartilhadas. Próximo em {left}s.</span>
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}><span className="t-stat" style={{ fontSize: 56 }}>{presentes}</span><span style={{ fontSize: 20 }} className="on-night-muted">/{Math.max(total, presentes)}</span></div>
        <span className="t-small on-night-muted">alunos no tatame</span>
        <div className="scroll-x" style={{ justifyContent: 'center', maxWidth: '100%' }}>{aulasDoDia(db, today()).map((x) => <button key={x.id} className="os-pill" aria-pressed={x.id === a.id} onClick={() => go(`prof/x/qr/${x.id}`)}>{x.nome}</button>)}</div>
        <button className="os-btn os-btn--light os-btn--block" onClick={() => history.back()}>Encerrar check-in</button>
      </div>
    </div>
  );
}
