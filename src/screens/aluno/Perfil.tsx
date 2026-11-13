import { useEffect, useRef, useState } from 'react';
import { update, sair, toast, trocarSenha } from '../../data/store';
import { Avatar, LinkCard, Overline, Setting, Sheet, Field } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { go } from '../../ui/router';
import { fileToAvatar } from '../../ui/photo';
import { planoNome } from '../../data/seed';
import { useMe } from './common';

type Form = { nome: string; nasc: string; tel: string; resp: string; turma: string };

export default function Perfil() {
  const { db, me } = useMe();
  const [sheet, setSheet] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const base: Form = { nome: me.nome, nasc: me.nasc, tel: me.tel, resp: me.resp, turma: me.turma };
  const [f, setF] = useState<Form>(base);
  useEffect(() => setF({ nome: me.nome, nasc: me.nasc, tel: me.tel, resp: me.resp, turma: me.turma }), [me.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const mudou = JSON.stringify(f) !== JSON.stringify(base);

  const salvar = () => {
    if (!f.nome.trim()) { toast('O nome não pode ficar vazio.'); return; }
    update((d) => { Object.assign(d.students.find((x) => x.id === me.id)!, { ...f, nome: f.nome.trim() }); });
    toast('Perfil salvo.');
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setSheet(false);
    try {
      const foto = await fileToAvatar(file);
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

  const campo = { height: 44, border: 0, borderBottom: '1px solid var(--line)', font: '600 15px var(--font-sans)', color: 'var(--ink)', background: 'transparent', padding: 0, outline: 'none', width: '100%' } as const;
  const lbl = { letterSpacing: '0.08em', paddingTop: 12 } as const;

  return (
    <div className="scroll">
      <div className="screen-title" style={{ alignItems: 'center', gap: 12 }}>
        <Avatar s={me} size={96} />
        <button className="os-btn os-btn--quiet os-btn--sm" onClick={() => setSheet(true)}><Icon n="camera" size={16} />Alterar foto</button>
      </div>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div className="os-card os-card--flat" style={{ padding: '6px 16px 16px', gap: 0 }}>
          <label htmlFor="f-nome" className="os-overline" style={lbl}>Nome</label>
          <input id="f-nome" style={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          <label htmlFor="f-nasc" className="os-overline" style={lbl}>Nascimento</label>
          <input id="f-nasc" style={campo} inputMode="numeric" placeholder="dd/mm/aaaa" value={f.nasc} onChange={(e) => setF({ ...f, nasc: e.target.value })} />
          <label htmlFor="f-tel" className="os-overline" style={lbl}>Telefone</label>
          <input id="f-tel" style={campo} inputMode="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
          <label htmlFor="f-resp" className="os-overline" style={lbl}>Responsável</label>
          <input id="f-resp" style={campo} placeholder="Nome · telefone (se menor de idade)" value={f.resp} onChange={(e) => setF({ ...f, resp: e.target.value })} />
          <label htmlFor="f-turma" className="os-overline" style={lbl}>Turma</label>
          <select id="f-turma" style={{ ...campo, appearance: 'auto' }} value={f.turma} onChange={(e) => setF({ ...f, turma: e.target.value })}>
            <option value="">Escolha sua turma</option>
            {db.aulas.filter((a) => a.grupo !== 'Todos').map((a) => <option key={a.id} value={a.id}>{a.nome} · {a.ini}</option>)}
          </select>
          <button className="os-btn os-btn--primary os-btn--block" style={{ marginTop: 16 }} disabled={!mudou} onClick={salvar}>{mudou ? 'Salvar alterações' : 'Dados salvos'}</button>
        </div>
        <div className="os-list">
          <Setting title="Presença automática" sub="Usa a localização ao chegar na academia" on={me.geoAuto} onChange={togGeo} />
          <Setting title="Notificações" sub="Aprovações, anotações e graduações" on={me.notif} onChange={togNotif} />
        </div>

        <Overline>Minha conta</Overline>
        <LinkCard icon="doc" title="Meu plano" sub={`${planoNome(me.plano)}${me.fundador ? ` · fundador #${me.fundador}` : ''}`} onClick={() => go('aluno/x/contrato')} />
        <LinkCard icon="money" title="Mensalidade" sub={me.pay === 'pago' ? 'Em dia' : me.pay === 'analise' ? 'Pagamento em análise' : me.pay === 'atraso' ? 'Em atraso' : 'Em aberto'} onClick={() => go('aluno/x/mensalidade')} />
        <LinkCard icon="card" title="Carteirinha" onClick={() => go('aluno/x/carteirinha')} />
        <LinkCard icon="scale" title="Regras e pontuação" onClick={() => go('aluno/x/regras')} />
        <LinkCard icon="lock" title="Trocar senha" sub={db.session?.email} onClick={() => setSenha('')} />

        <div className="os-card os-card--flat kv" style={{ padding: '14px 16px', flexDirection: 'row' }}><span>Equipe</span><span>{db.settings.equipe}</span></div>
        <button className="os-btn os-btn--danger" onClick={() => sair()}>Sair</button>
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
      {senha !== null && (
        <Sheet title="Trocar senha" onClose={() => setSenha(null)}>
          <Field label="Nova senha"><input className="os-input" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" /></Field>
          <button className="os-btn os-btn--primary os-btn--block" onClick={async () => { if (senha.length < 6) { toast('Mínimo 6 caracteres.'); return; } const r = await trocarSenha(senha); toast(r ?? 'Senha alterada.'); if (!r) setSenha(null); }}>Salvar senha</button>
        </Sheet>
      )}
    </div>
  );
}
