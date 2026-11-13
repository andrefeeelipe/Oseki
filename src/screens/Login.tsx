import { useState } from 'react';
import { useDB, login, toast } from '../data/store';
import { Logo } from '../ui/Icon';
import { go } from '../ui/router';
import { Sheet, Avatar } from '../ui/kit';

export default function Login() {
  const db = useDB();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState<null | string>(null);
  const [escolher, setEscolher] = useState(false);

  const entrarAluno = (sid: string, primeira = true) => { login('aluno', sid); setTimeout(() => go(primeira ? 'aluno/x/permissao' : 'aluno/inicio'), 0); };
  const entrarProf = () => { login('admin'); setTimeout(() => go('prof/chamada'), 0); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em || !senha) { toast('Preencha e-mail e senha.'); return; }
    if (em.startsWith('prof') || em.startsWith('marangoni') || em.startsWith('oseki')) return entrarProf();
    const s = db.students.find((x) => x.email === em);
    if (s) return entrarAluno(s.id);
    toast('Conta não encontrada. Na demo, use lucas@demo.oseki ou prof@demo.oseki.');
  };

  return (
    <div className="login os-tatame" style={{ borderRadius: 0, gap: 28 }}>
      <div className="col" style={{ gap: 22 }}>
        <div className="logo"><Logo /></div>
        <div className="col" style={{ gap: 6 }}>
          <span className="t-wordmark">Oseki BJJ</span>
          <span className="on-night-muted" style={{ fontSize: 14 }}>{db.settings.equipe}</span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#DCE3EA', maxWidth: 300 }}>Presença, faixa e evolução de cada aluno, no tatame e no celular.</p>
      </div>

      <form className="col" style={{ gap: 12 }} onSubmit={submit}>
        <label className="os-field"><span className="os-field__label">E-mail</span>
          <input className="os-input" type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="os-field"><span className="os-field__label">Senha</span>
          <input className="os-input" type="password" autoComplete="current-password" placeholder="••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <button type="submit" className="os-btn os-btn--light os-btn--block">Entrar</button>
        <button type="button" className="link" style={{ color: '#fff', alignSelf: 'center', padding: 8 }} onClick={() => setCodigo('')}>Entrar com o código da academia</button>

        <div className="divider" style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '6px 0' }} />
        <span className="os-overline" style={{ color: 'var(--on-night-muted)', textAlign: 'center' }}>Testar sem conta</span>
        <button type="button" className="os-btn os-btn--light os-btn--block" onClick={() => setEscolher(true)}>Entrar como aluno</button>
        <button type="button" className="os-btn os-btn--block btn-ghost-night" onClick={entrarProf}>Entrar como professor</button>
        <button type="button" className="link" style={{ color: 'var(--on-night-muted)', alignSelf: 'center', padding: 8, fontWeight: 600 }} onClick={() => go('painel')}>Painel da academia (computador)</button>
        <span style={{ textAlign: 'center', fontSize: 12, color: '#AEB9C5' }}>Novo aluno? Peça o convite ao seu professor. Oss!</span>
      </form>

      {codigo !== null && (
        <Sheet title="Código da academia" onClose={() => setCodigo(null)}>
          <span className="t-small muted">Seu professor passa o código. Na demo, use {db.settings.codigo}.</span>
          <input className="os-input os-input--code" aria-label="Código da academia" placeholder="OSEKI-0000" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
          <button className="os-btn os-btn--primary os-btn--block" onClick={() => {
            if (codigo.trim() !== db.settings.codigo) { toast('Código inválido.'); return; }
            setCodigo(null); setEscolher(true);
          }}>Continuar</button>
        </Sheet>
      )}

      {escolher && (
        <Sheet title="Quem é você?" onClose={() => setEscolher(false)}>
          <div style={{ maxHeight: '50dvh', overflowY: 'auto' }}>
            {db.students.map((s) => (
              <button key={s.id} className="sheet-opt" style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }} onClick={() => entrarAluno(s.id)}>
                <Avatar s={s} size={34} /> <span className="grow">{s.nome}</span> <span className="t-sub">{s.belt}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
