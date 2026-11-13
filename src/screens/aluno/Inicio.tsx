import { useEffect } from 'react';
import { marcarPresenca, toast } from '../../data/store';
import { curta, distTxt, freqMes, grausTxt, iso, metaDe, naJanela, pct, primeiro, aulasDoAluno, today } from '../../data/util';
import { Avatar, Belt, Chip, LinkCard, Overline, StatCard, attChip } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { useMe, proximaAula, attDe, useGeo } from './common';

export default function Inicio() {
  const { db, me } = useMe();
  const set = db.settings;
  const prox = proximaAula(db, me);
  const hoje = iso(today());
  const ehHoje = prox && iso(prox.date) === hoje;
  const att = prox && ehHoje ? attDe(db, me.id, hoje, prox.aula.id) : null;
  const meta = metaDe(db, me);
  const fm = freqMes(db, me);
  const unread = db.notifs.filter((n) => n.to === me.id && !n.read).length;
  const semana = db.tecnicas.find((t) => t.semana);
  const chegouHoje = db.geoChegada[me.id] === hoje;

  const geoAtivo = me.geoAuto && set.metodos.gps;
  const { dist, err } = useGeo(geoAtivo && !chegouHoje, set.lat, set.lng);

  // Presença automática: entrou no raio, no horário da aula
  useEffect(() => {
    if (!geoAtivo || dist == null || chegouHoje) return;
    if (dist > set.raio) return;
    const aula = aulasDoAluno(db, me).find((a) => a.dias.includes(today().getDay()) && naJanela(a));
    if (!aula) return;
    const r = marcarPresenca(me.id, aula.id, hoje, 'gps');
    toast(r === 'ok' ? `Você chegou na academia. Presença registrada · ${aula.nome}.` : 'Você chegou. Presença enviada para o professor aprovar.');
  }, [dist]); // eslint-disable-line react-hooks/exhaustive-deps

  const simular = () => {
    const aula = aulasDoAluno(db, me).find((a) => a.dias.includes(today().getDay()));
    if (!aula) { toast('Hoje não tem aula da sua turma. Tente num dia de treino.'); return; }
    const r = marcarPresenca(me.id, aula.id, hoje, 'gps');
    toast(r === 'ok' ? 'Presença registrada por GPS.' : 'Chegada enviada para aprovação.');
  };

  const marcar = () => {
    if (!prox) return;
    marcarPresenca(me.id, prox.aula.id, hoje, 'app');
    toast('Presença enviada. O professor vai aprovar.');
  };

  const chip = att ? attChip(att) : ehHoje ? { tone: 'info' as const, t: 'Hoje' } : { tone: 'neutral' as const, t: prox ? curta(prox.date) : '' };
  const gpsAtt = db.att.find((x) => x.sid === me.id && x.date === hoje && x.via === 'gps' && x.status !== 'rej');

  return (
    <div className="scroll">
      <div className="os-tatame os-tatame--brand hero">
        <div className="row" style={{ gap: 14 }}>
          <Avatar s={me} size={56} />
          <div className="grow col" style={{ gap: 2 }}>
            <span className="t-greeting">Oss, {primeiro(me.nome)}!</span>
            <span className="os-tatame__sub">{set.equipe}</span>
          </div>
          <button className="icon-btn" aria-label={`Notificações${unread ? `, ${unread} novas` : ''}`} onClick={() => go('aluno/x/notif')}>
            <Icon n="bell" size={20} />{unread > 0 && <span className="badge">{unread}</span>}
          </button>
        </div>
        <div className="col-2">
          <div className="row-between" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
            <span>FAIXA {me.belt.toUpperCase()}</span><span className="on-night-muted">{grausTxt(me.graus).toUpperCase()}</span>
          </div>
          <Belt belt={me.belt} graus={me.graus} />
        </div>
      </div>

      <div className="pad" style={{ paddingTop: 20 }}>
        {/* Presença automática */}
        {gpsAtt ? (
          <div className="success-card">
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="check" sw={2.6} /></div>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{gpsAtt.status === 'ok' ? 'Você chegou na academia' : 'Chegada enviada'}</span>
              <span style={{ fontSize: 12, color: '#D7EEDF' }}>{gpsAtt.status === 'ok' ? 'Presença registrada' : 'Aguardando aprovação'} às {gpsAtt.at} · {db.aulas.find((a) => a.id === gpsAtt.classId)?.nome}</span>
            </div>
          </div>
        ) : geoAtivo ? (
          <div className="os-card" style={{ padding: 18, gap: 14 }}>
            <div className="row">
              <div className="ic-box"><Icon n="pin" /></div>
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Presença automática ativa</span>
                <span className="t-sub">{set.lat == null ? 'O professor ainda não marcou a área da academia' : err ? err : dist == null ? 'Procurando sua localização…' : dist <= set.raio ? 'Você está na academia' : `Fora da academia · ${distTxt(dist)} de distância`}</span>
              </div>
            </div>
            <p className="t-small muted" style={{ margin: 0 }}>Ao entrar no raio de {set.raio} m da academia no horário da sua aula, a presença é registrada sozinha.</p>
            <button className="os-btn os-btn--dashed" onClick={simular}>Simular chegada na academia</button>
          </div>
        ) : (
          <div className="os-card row" style={{ padding: 18, flexDirection: 'row' }}>
            <div className="ic-box" style={{ background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}><Icon n="pinOff" /></div>
            <span className="t-small muted">Presença automática desligada. Ative em <button className="link" onClick={() => go('aluno/perfil')}>Perfil</button> ou marque manualmente.</span>
          </div>
        )}

        {/* Aula de hoje */}
        <Overline>{ehHoje ? `Aula de hoje · ${curta(today())}` : 'Próxima aula'}</Overline>
        {prox ? (
          <div className="os-card" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            <div className="row-between" style={{ padding: '16px 18px', alignItems: 'flex-start' }}>
              <div className="col" style={{ gap: 4 }}>
                <span style={{ font: '700 24px/1 var(--font-display)', textTransform: 'uppercase' }}>{prox.aula.nome}</span>
                <span className="t-small muted">{ehHoje ? '' : curta(prox.date) + ' · '}{prox.aula.ini} – {prox.aula.fim} · {prox.aula.prof}</span>
              </div>
              <Chip tone={chip.tone}>{chip.t}</Chip>
            </div>
            {ehHoje && (!att || att.status === 'rej') && set.metodos.app && (
              <div className="row-between divider" style={{ padding: '12px 18px' }}>
                <span className="t-sub">Esqueceu o GPS? Marque e o professor aprova.</span>
                <button className="os-btn os-btn--primary os-btn--sm" onClick={marcar}>Marcar presença</button>
              </div>
            )}
            {ehHoje && (!att || att.status === 'rej') && set.metodos.qr && (
              <div className="divider" style={{ padding: '10px 18px' }}>
                <button className="link" onClick={() => go('aluno/x/qr')}><Icon n="qr" size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Check-in por QR Code</button>
              </div>
            )}
          </div>
        ) : (
          <div className="os-card"><span className="t-small muted">Nenhuma aula da sua turma nos próximos dias.</span></div>
        )}

        {/* Progresso */}
        <div className="grid-2">
          <StatCard label="PRÓXIMO GRAU" value={me.aulas} of={meta} bar={pct(me.aulas, meta)} foot="aulas na faixa" />
          <StatCard label="FREQUÊNCIA" value={`${fm}%`} bar={fm} foot={`em ${today().toLocaleDateString('pt-BR', { month: 'long' })}`} />
        </div>

        {/* Posição da semana */}
        {semana && (
          <button className="os-card os-card--night" style={{ padding: 18, gap: 10, textAlign: 'left', border: 0, cursor: 'pointer' }} onClick={() => go('aluno/x/tecnicas')}>
            <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#121A24', background: '#fff', borderRadius: 6, padding: '4px 8px' }}>POSIÇÃO DA SEMANA</span>
            <span style={{ font: '700 24px/1.05 var(--font-display)', textTransform: 'uppercase' }}>{semana.titulo}</span>
            <span className="t-small os-muted">{semana.desc} Treine na próxima aula.</span>
          </button>
        )}

        <Overline>Atalhos</Overline>
        <div className="menu-grid">
          <LinkCard icon="cal" title="Grade semanal" onClick={() => go('aluno/x/grade')} right={<></>} />
          <LinkCard icon="chart" title="Evolução" onClick={() => go('aluno/x/evolucao')} right={<></>} />
          <LinkCard icon="trophy" title="Ranking" onClick={() => go('aluno/x/ranking')} right={<></>} />
          <LinkCard icon="book" title="Técnicas" onClick={() => go('aluno/x/tecnicas')} right={<></>} />
        </div>
      </div>
    </div>
  );
}
