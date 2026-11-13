import { useRef, useState } from 'react';
import { update, logout, toast, resetDemo } from '../../data/store';
import { Avatar, LinkCard, Overline, Setting, Sheet } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { fileToAvatar } from '../../ui/photo';
import { planoNome } from '../../data/seed';
import { useMe } from './common';

export default function Perfil() {
  const { db, me } = useMe();
  const [sheet, setSheet] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const set = (k: 'nome' | 'nasc' | 'tel' | 'resp', v: string) => update((d) => { const s = d.students.find((x) => x.id === me.id)!; s[k] = v; });

  const onFile = async (f?: File) => {
    if (!f) return;
    setSheet(false);
    try {
      const foto = await fileToAvatar(f);
      update((d) => { d.students.find((x) => x.id === me.id)!.foto = foto; });
      toast('Foto atualizada.');
    } catch { toast('Não foi possível abrir essa imagem.'); }
  };

  const togGeo = (v: boolean) => {
    update((d) => { d.students.find((x) => x.id === me.id)!.geoAuto = v; });
    if (v && 'geolocation' in navigator) navigator.geolocation.getCurrentPosition(() => toast('Presença automática ativada.'), () => toast('Permita a localização nas configurações do aparelho.'));
  };
  const togNotif = (v: boolean) => {
    update((d) => { d.students.find((x) => x.id === me.id)!.notif = v; });
    if (v && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  const F = ({ id, label, k }: { id: string; label: string; k: 'nome' | 'nasc' | 'tel' | 'resp' }) => (
    <>
      <label htmlFor={id} className="os-overline" style={{ letterSpacing: '0.08em', paddingTop: 12 }}>{label}</label>
      <input id={id} defaultValue={me[k]} onBlur={(e) => { if (e.target.value !== me[k]) { set(k, e.target.value); toast('Dados salvos.'); } }}
        style={{ height: 40, border: 0, borderBottom: '1px solid var(--line)', font: '600 15px var(--font-sans)', color: 'var(--ink)', background: 'transparent', padding: 0, outline: 'none' }} />
    </>
  );

  return (
    <div className="scroll">
      <div className="screen-title" style={{ alignItems: 'center', gap: 12 }}>
        <Avatar s={me} size={96} />
        <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => setSheet(true)}><Icon n="camera" size={16} />Alterar foto</button>
      </div>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div className="os-card os-card--flat" style={{ padding: '6px 16px 14px', gap: 0 }}>
          <F id="f-nome" label="Nome" k="nome" />
          <F id="f-nasc" label="Nascimento" k="nasc" />
          <F id="f-tel" label="Telefone" k="tel" />
          <F id="f-resp" label="Responsável" k="resp" />
        </div>
        <div className="os-list">
          <Setting title="Presença automática" sub="Usa a localização ao chegar na academia" on={me.geoAuto} onChange={togGeo} />
          <Setting title="Notificações" sub="Aprovações, anotações e graduações" on={me.notif} onChange={togNotif} />
        </div>

        <Overline>Minha conta</Overline>
        <LinkCard icon="doc" title="Meu plano" sub={`${planoNome(me.plano)}${me.fundador ? ` · fundador #${me.fundador}` : ''}`} onClick={() => go('aluno/x/contrato')} />
        <LinkCard icon="money" title="Mensalidade" sub={me.pay === 'pago' ? 'Em dia' : me.pay === 'analise' ? 'Pagamento em análise' : 'Em aberto'} onClick={() => go('aluno/x/mensalidade')} />
        <LinkCard icon="card" title="Carteirinha" onClick={() => go('aluno/x/carteirinha')} />
        <LinkCard icon="scale" title="Regras e pontuação" onClick={() => go('aluno/x/regras')} />

        <div className="os-card os-card--flat kv" style={{ padding: '14px 16px', flexDirection: 'row' }}><span>Equipe</span><span>{db.settings.equipe}</span></div>
        <button className="os-btn os-btn--danger" onClick={() => { logout(); go('login'); }}>Sair</button>
        <button className="link" style={{ alignSelf: 'center', fontWeight: 600, color: 'var(--ink-subtle)', fontSize: 12 }} onClick={() => { if (confirm('Apagar tudo que foi feito no teste e voltar aos dados de exemplo?')) { resetDemo(); toast('Dados de demonstração restaurados.'); } }}>Restaurar dados de demonstração</button>
      </div>

      <input ref={cam} type="file" accept="image/*" capture="user" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {sheet && (
        <Sheet title="Foto do perfil" onClose={() => setSheet(false)}>
          <button className="sheet-opt" onClick={() => cam.current?.click()}>Tirar foto</button>
          <button className="sheet-opt" onClick={() => gal.current?.click()}>Escolher da galeria</button>
          {me.foto && <button className="sheet-opt" style={{ color: 'var(--danger)', borderBottom: 0 }} onClick={() => { update((d) => { delete d.students.find((x) => x.id === me.id)!.foto; }); setSheet(false); toast('Foto removida.'); }}>Remover foto</button>}
        </Sheet>
      )}
    </div>
  );
}
