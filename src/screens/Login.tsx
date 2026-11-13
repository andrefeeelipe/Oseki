import { useEffect, useState } from 'react';
import { entrar, cadastrar, completarCadastro, codigoInicial, esqueciSenha, trocarSenha, sair, toast, authErro } from '../data/store';
import { Logo } from '../ui/Icon';
import { Sheet } from '../ui/kit';
import { MES, today } from '../data/util';

type Modo = 'entrar' | 'cadastro' | 'completar' | 'nova-senha';

export default function Login({ modo: inicial = 'entrar', desk = false }: { modo?: Modo; desk?: boolean }) {
  const [modo, setModo] = useState<Modo>(inicial);
  useEffect(() => setModo(inicial), [inicial]);
  return (
    <div className={desk ? 'desk-login os-root' : 'login os-tatame'} style={desk ? undefined : { borderRadius: 0, gap: 28 }}>
      {desk ? (
        <>
          <div className="os-tatame" style={{ borderRadius: 0 }}>
            <Marca />
            <div className="col" style={{ gap: 16 }}>
              <span style={{ font: '700 72px/0.92 var(--font-display)', textTransform: 'uppercase' }}>Painel da<br />academia</span>
              <span className="on-night-muted" style={{ fontSize: 16, maxWidth: 440, lineHeight: 1.6 }}>Presenças, faixas, alunos e mensalidades em tela grande. Tudo sincronizado com o app que alunos e professores usam no celular.</span>
            </div>
            <span className="os-tatame__sub">Marangoni BJJ / Oseki BJJ</span>
          </div>
          <div><div className="os-card os-card--desk" style={{ width: '100%', maxWidth: 420 }}><Form modo={modo} setModo={setModo} desk /></div></div>
        </>
      ) : (
        <>
          <Marca />
          <Form modo={modo} setModo={setModo} />
        </>
      )}
    </div>
  );
}

function Marca() {
  return (
    <div className="col" style={{ gap: 22 }}>
      <div className="logo" style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Logo /></div>
      <div className="col" style={{ gap: 6 }}>
        <span className="t-wordmark">Oseki BJJ</span>
        <span className="on-night-muted" style={{ fontSize: 14 }}>Marangoni BJJ / Oseki BJJ</span>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#DCE3EA', maxWidth: 300 }}>Presença, faixa e evolução de cada aluno, no tatame e no celular.</p>
    </div>
  );
}

function Form({ modo, setModo, desk }: { modo: Modo; setModo: (m: Modo) => void; desk?: boolean }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [msg, setMsg] = useState('');
  const [role, setRole] = useState<'aluno' | 'prof'>(desk ? 'prof' : 'aluno');
  const [f, setF] = useState({ nome: '', tel: '', nasc: '', resp: '', codigo: '' });
  const [primeiro, setPrimeiro] = useState<string | null>(null);

  useEffect(() => { if (modo === 'cadastro' || modo === 'completar') codigoInicial().then(setPrimeiro); }, [modo]);
  useEffect(() => { if (modo === 'completar' && authErro()) setMsg(authErro()); }, [modo]);
  useEffect(() => { if (primeiro && role === 'prof') setF((x) => ({ ...x, codigo: primeiro })); }, [primeiro, role]);

  const lbl = desk ? undefined : { color: 'var(--on-night-muted)' };
  const inputCls = 'os-input';
  const btn = desk ? 'os-btn os-btn--primary os-btn--desk os-btn--block' : 'os-btn os-btn--light os-btn--block';
  const link: React.CSSProperties = { color: desk ? 'var(--brand-ink)' : '#fff', alignSelf: 'center', padding: 8 };

  const dadosPerfil = () => {
    const agora = today();
    const base = { nome: f.nome.trim(), tel: f.tel.trim() };
    if (role === 'prof') return { ...base, belt: 'Preta', graus: 0 };
    return { ...base, nasc: f.nasc.trim(), resp: f.resp.trim(), belt: 'Branca', graus: 0, aulas: 0, desde: `${MES[agora.getMonth()]} ${agora.getFullYear()}`, matricula: String(Date.now()).slice(-6), plano: 'mensal', status: 'ativo', pagamentos: [], notes: [], hist: [{ t: 'Início no Jiu-Jitsu', d: `${MES[agora.getMonth()]} ${agora.getFullYear()}` }], tecnicas: {}, geoAuto: true, notif: true, apto: false, mesesEmDia: 0, turma: '', contrato: { assinado: false, vig: '—', renova: true, status: 'assin' } };
  };

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (modo === 'entrar') {
      if (!email || !senha) return setMsg('Preencha e-mail e senha.');
      setBusy(true); const r = await entrar(email, senha); setBusy(false);
      if (r) setMsg(r);
      return;
    }
    if (modo === 'nova-senha') {
      if (senha.length < 6) return setMsg('A senha precisa ter pelo menos 6 caracteres.');
      setBusy(true); const r = await trocarSenha(senha); setBusy(false);
      if (r) setMsg(r); else toast('Senha alterada. Oss!');
      return;
    }
    if (!f.nome.trim()) return setMsg('Informe seu nome completo.');
    if (!f.codigo.trim()) return setMsg(role === 'aluno' ? 'Informe o código da academia (peça ao professor).' : 'Informe o código de professor.');
    if (role === 'aluno' && !/^\d{2}\/\d{2}\/\d{4}$/.test(f.nasc.trim())) return setMsg('Data de nascimento no formato dd/mm/aaaa.');
    const pend = { role, codigo: f.codigo.trim(), data: dadosPerfil() };
    setBusy(true);
    const r = modo === 'cadastro' ? await cadastrar(email, senha, pend) : await completarCadastro(pend);
    setBusy(false);
    if (r === 'confirmar') { setMsg(''); toast('Enviamos um link para o seu e-mail. Confirme e depois entre.'); setModo('entrar'); return; }
    if (r) setMsg(r);
    else toast(role === 'aluno' ? 'Conta criada. Bem-vindo ao tatame. Oss!' : 'Conta de professor criada. Oss!');
  };

  const nasc = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  return (
    <form className="col" style={{ gap: 12 }} onSubmit={go}>
      {desk && <span className="os-chip os-chip--danger" style={{ alignSelf: 'flex-start' }}>Acesso restrito a professores</span>}
      <span className={desk ? 't-display-sm' : 't-display-sm'} style={{ color: desk ? undefined : '#fff' }}>
        {modo === 'entrar' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : modo === 'completar' ? 'Concluir cadastro' : 'Nova senha'}
      </span>

      {(modo === 'cadastro' || modo === 'completar') && !desk && (
        <div className="seg" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {(['aluno', 'prof'] as const).map((r) => <button type="button" key={r} aria-pressed={role === r} onClick={() => { setRole(r); setF({ ...f, codigo: r === 'prof' && primeiro ? primeiro : '' }); }} style={{ color: role === r ? undefined : '#fff' }}>{r === 'aluno' ? 'Sou aluno' : 'Sou professor'}</button>)}
        </div>
      )}

      {(modo === 'cadastro' || modo === 'completar') && (
        <label className="os-field"><span className="os-field__label" style={lbl}>Nome completo</span>
          <input className={inputCls} autoComplete="name" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
      )}
      {modo !== 'completar' && modo !== 'nova-senha' && (
        <label className="os-field"><span className="os-field__label" style={lbl}>E-mail</span>
          <input className={inputCls} type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      )}
      {modo !== 'completar' && (
        <label className="os-field"><span className="os-field__label" style={lbl}>{modo === 'nova-senha' ? 'Nova senha' : 'Senha'}</span>
          <input className={inputCls} type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} placeholder={modo === 'entrar' ? '••••••' : 'mínimo 6 caracteres'} value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      )}
      {(modo === 'cadastro' || modo === 'completar') && (
        <>
          <label className="os-field"><span className="os-field__label" style={lbl}>Telefone (WhatsApp)</span>
            <input className={inputCls} inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} /></label>
          {role === 'aluno' && (
            <>
              <label className="os-field"><span className="os-field__label" style={lbl}>Nascimento</span>
                <input className={inputCls} inputMode="numeric" placeholder="dd/mm/aaaa" value={f.nasc} onChange={(e) => setF({ ...f, nasc: nasc(e.target.value) })} /></label>
              <label className="os-field"><span className="os-field__label" style={lbl}>Responsável (se menor de idade)</span>
                <input className={inputCls} placeholder="Nome · telefone" value={f.resp} onChange={(e) => setF({ ...f, resp: e.target.value })} /></label>
            </>
          )}
          {role === 'prof' && primeiro ? (
            <span className="t-small" style={{ color: desk ? 'var(--ink-muted)' : 'var(--on-night-muted)' }}>Primeiro acesso: esta conta será a administradora da academia. Depois, o código de professor fica em Mais → Dados da academia.</span>
          ) : (
            <label className="os-field"><span className="os-field__label" style={lbl}>{role === 'aluno' ? 'Código da academia' : 'Código de professor'}</span>
              <input className={`${inputCls} os-input--code`} placeholder={role === 'aluno' ? 'Peça ao professor' : 'Peça ao administrador'} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })} /></label>
          )}
        </>
      )}

      {msg && <span className="os-chip os-chip--danger" role="alert" style={{ height: 'auto', padding: '8px 12px', whiteSpace: 'normal', lineHeight: 1.4 }}>{msg}</span>}
      <button type="submit" className={btn} disabled={busy}>{busy ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'nova-senha' ? 'Salvar nova senha' : 'Criar conta'}</button>

      {modo === 'entrar' && (
        <>
          <button type="button" className="link" style={link} onClick={() => setEsqueci(true)}>Esqueci minha senha</button>
          {!desk && <div className="divider" style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />}
          <button type="button" className={desk ? 'os-btn os-btn--secondary os-btn--desk os-btn--block' : 'os-btn os-btn--block btn-ghost-night'} onClick={() => { setMsg(''); setModo('cadastro'); }}>{desk ? 'Criar conta de professor' : 'Criar conta'}</button>
          <span style={{ textAlign: 'center', fontSize: 12, color: desk ? 'var(--ink-subtle)' : '#AEB9C5' }}>{desk ? 'Alunos usam o app Oseki BJJ no celular.' : 'Novo aluno? Peça o código da academia ao seu professor. Oss!'}</span>
        </>
      )}
      {modo === 'cadastro' && <button type="button" className="link" style={link} onClick={() => { setMsg(''); setModo('entrar'); }}>Já tenho conta · Entrar</button>}
      {modo === 'completar' && <button type="button" className="link" style={link} onClick={() => sair()}>Sair desta conta</button>}

      {esqueci && (
        <Sheet title="Recuperar senha" onClose={() => setEsqueci(false)}>
          <span className="t-small muted">Enviamos um link para o seu e-mail para criar uma senha nova.</span>
          <input className="os-input" type="email" aria-label="E-mail" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="os-btn os-btn--primary os-btn--block" onClick={async () => { const r = await esqueciSenha(email); if (r) toast(r); else { toast('Link enviado. Veja seu e-mail.'); setEsqueci(false); } }}>Enviar link</button>
        </Sheet>
      )}
    </form>
  );
}
