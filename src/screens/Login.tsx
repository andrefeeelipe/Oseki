import { useEffect, useState } from 'react';
import { entrar, cadastrar, completarCadastro, codigoInicial, esqueciSenha, trocarSenha, sair, toast, authErro, fichasLivres, type Ficha } from '../data/store';
import { Belt } from '../ui/kit';
import type { BeltName } from '../data/types';
import { LogoOseki } from '../ui/brand';
import { Sheet } from '../ui/kit';
import { MES, today } from '../data/util';

type Modo = 'entrar' | 'cadastro' | 'completar' | 'nova-senha' | 'ja-aluno';

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
    <div className="col" style={{ gap: 18, color: '#fff' }}>
      <LogoOseki width={150} />
      <span className="on-night-muted" style={{ fontSize: 14 }}>Marangoni BJJ / Oseki BJJ</span>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#DCE3EA', maxWidth: 300 }}>Presença, faixa e evolução de cada aluno, no tatame e no celular.</p>
    </div>
  );
}

function Form({ modo, setModo, desk }: { modo: Modo; setModo: (m: Modo) => void; desk?: boolean }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [busca, setBusca] = useState('');
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [busy, setBusy] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [msg, setMsg] = useState('');
  const [role, setRole] = useState<'aluno' | 'prof'>(desk ? 'prof' : 'aluno');
  const [f, setF] = useState({ nome: '', apelido: '', tel: '', nasc: '', resp: '', codigo: '' });
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
    const base = { nome: f.nome.trim(), apelido: f.apelido.trim(), tel: f.tel.trim() };
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
    const confere = () => senha.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' : senha !== senha2 ? 'As senhas não conferem. Digite a mesma senha nos dois campos.' : '';
    if (modo === 'ja-aluno') {
      if (!fichas) {
        if (!f.codigo.trim()) return setMsg('Informe o código da academia (peça ao professor).');
        setBusy(true); const r = await fichasLivres(f.codigo); setBusy(false);
        if (typeof r === 'string') return setMsg(r);
        setFichas(r); return;
      }
      if (!ficha) return setMsg('Encontre e toque no seu nome na lista.');
      if (!email.trim()) return setMsg('Informe seu e-mail.');
      { const c = confere(); if (c) return setMsg(c); }
      setBusy(true);
      const r = await cadastrar(email, senha, { role: 'aluno', codigo: f.codigo.trim(), data: { vinculo: ficha.id, apelido: f.apelido.trim(), tel: f.tel.trim() } });
      setBusy(false);
      if (r === 'confirmar') { toast('Enviamos um link para o seu e-mail. Confirme e depois entre.'); setModo('entrar'); return; }
      if (r) setMsg(r); else toast('Acesso liberado. Sua faixa e suas aulas já estão aqui. Oss!');
      return;
    }
    if (modo === 'nova-senha') {
      { const c = confere(); if (c) return setMsg(c); }
      setBusy(true); const r = await trocarSenha(senha); setBusy(false);
      if (r) setMsg(r); else toast('Senha alterada. Oss!');
      return;
    }
    if (!f.nome.trim()) return setMsg('Informe seu nome completo.');
    if (!f.codigo.trim()) return setMsg(role === 'aluno' ? 'Informe o código da academia (peça ao professor).' : 'Informe o código de professor.');
    if (modo === 'cadastro') { const c = confere(); if (c) return setMsg(c); }
    if (role === 'aluno' && !/^\d{2}\/\d{2}\/\d{4}$/.test(f.nasc.trim())) return setMsg('Data de nascimento no formato dd/mm/aaaa.');
    const pend = { role, codigo: f.codigo.trim(), data: dadosPerfil() };
    setBusy(true);
    const r = modo === 'cadastro' ? await cadastrar(email, senha, pend) : await completarCadastro(pend);
    setBusy(false);
    if (r === 'confirmar') { setMsg(''); toast('Enviamos um link para o seu e-mail. Confirme e depois entre.'); setModo('entrar'); return; }
    if (r) setMsg(r);
    else toast(role === 'aluno' ? 'Conta criada. Bem-vindo ao tatame. Oss!' : 'Conta de professor criada. Oss!');
  };

  const sem = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nasc = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  return (
    <form className="col" style={{ gap: 12 }} onSubmit={go}>
      {desk && <span className="os-chip os-chip--danger" style={{ alignSelf: 'flex-start' }}>Acesso restrito a professores</span>}
      <span className={desk ? 't-display-sm' : 't-display-sm'} style={{ color: desk ? undefined : '#fff' }}>
        {modo === 'entrar' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : modo === 'completar' ? 'Concluir cadastro' : modo === 'ja-aluno' ? 'Já sou aluno' : 'Nova senha'}
      </span>

      {modo === 'ja-aluno' && !fichas && (
        <>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: desk ? 'var(--ink-muted)' : '#DCE3EA' }}>Você já treina na academia? Sua ficha, faixa e graus já estão no app. Informe o código da academia para encontrar seu nome.</span>
          <label className="os-field"><span className="os-field__label" style={lbl}>Código da academia</span>
            <input className={`${inputCls} os-input--code`} placeholder="Peça ao professor" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })} /></label>
        </>
      )}
      {modo === 'ja-aluno' && fichas && !ficha && (
        <>
          <label className="os-field"><span className="os-field__label" style={lbl}>Procure seu nome</span>
            <input className={inputCls} placeholder="Digite parte do nome" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
          <div className="col" style={{ gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {fichas.filter((x) => sem(x.nome + ' ' + (x.apelido || '')).includes(sem(busca))).slice(0, 40).map((x) => (
              <button type="button" key={x.id} className="os-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setFicha(x); setMsg(''); }}>
                <Belt belt={x.belt as BeltName} graus={x.graus} size="sm" style={{ width: 44, flex: 'none' }} />
                <span style={{ fontWeight: 600 }}>{x.nome}{x.apelido ? <span className="muted"> · {x.apelido}</span> : null}</span>
              </button>
            ))}
          </div>
          <span className="t-small" style={{ color: desk ? 'var(--ink-muted)' : 'var(--on-night-muted)' }}>Não achou seu nome? Volte e use "Criar conta", ou fale com o professor.</span>
        </>
      )}
      {modo === 'ja-aluno' && ficha && (
        <>
          <div className="os-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
            <Belt belt={ficha.belt as BeltName} graus={ficha.graus} size="sm" style={{ width: 44, flex: 'none' }} />
            <span style={{ fontWeight: 600, flex: 1 }}>{ficha.nome}</span>
            <button type="button" className="link" onClick={() => setFicha(null)}>Trocar</button>
          </div>
          <label className="os-field"><span className="os-field__label" style={lbl}>Apelido (opcional)</span>
            <input className={inputCls} placeholder="Como te chamam no tatame" value={f.apelido} onChange={(e) => setF({ ...f, apelido: e.target.value })} /></label>
          <label className="os-field"><span className="os-field__label" style={lbl}>Telefone (WhatsApp)</span>
            <input className={inputCls} inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} /></label>
        </>
      )}

      {(modo === 'cadastro' || modo === 'completar') && !desk && (
        <div className="seg" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {(['aluno', 'prof'] as const).map((r) => <button type="button" key={r} aria-pressed={role === r} onClick={() => { setRole(r); setF({ ...f, codigo: r === 'prof' && primeiro ? primeiro : '' }); }} style={{ color: role === r ? undefined : '#fff' }}>{r === 'aluno' ? 'Sou aluno' : 'Sou professor'}</button>)}
        </div>
      )}

      {(modo === 'cadastro' || modo === 'completar') && (
        <label className="os-field"><span className="os-field__label" style={lbl}>Nome completo</span>
          <input className={inputCls} autoComplete="name" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
      )}
      {(modo === 'cadastro' || modo === 'completar') && (
        <label className="os-field"><span className="os-field__label" style={lbl}>Apelido (opcional)</span>
          <input className={inputCls} placeholder="Como te chamam no tatame" value={f.apelido} onChange={(e) => setF({ ...f, apelido: e.target.value })} /></label>
      )}
      {modo !== 'completar' && modo !== 'nova-senha' && (modo !== 'ja-aluno' || ficha) && (
        <label className="os-field"><span className="os-field__label" style={lbl}>E-mail</span>
          <input className={inputCls} type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      )}
      {modo !== 'completar' && (modo !== 'ja-aluno' || ficha) && (
        <label className="os-field"><span className="os-field__label" style={lbl}>{modo === 'nova-senha' ? 'Nova senha' : modo === 'entrar' ? 'Senha' : 'Crie uma senha'}</span>
          <input className={inputCls} type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} placeholder={modo === 'entrar' ? '••••••' : 'mínimo 6 caracteres'} value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      )}
      {(modo === 'cadastro' || modo === 'nova-senha' || (modo === 'ja-aluno' && ficha)) && (
        <label className="os-field"><span className="os-field__label" style={lbl}>Confirme a senha</span>
          <input className={inputCls} type="password" autoComplete="new-password" placeholder="digite a mesma senha" value={senha2} onChange={(e) => setSenha2(e.target.value)} /></label>
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
      <button type="submit" className={btn} disabled={busy}>{busy ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'nova-senha' ? 'Salvar nova senha' : modo === 'ja-aluno' ? (!fichas ? 'Buscar meu nome' : ficha ? 'Liberar meu acesso' : 'Escolha seu nome') : 'Criar conta'}</button>

      {modo === 'entrar' && (
        <>
          <button type="button" className="link" style={link} onClick={() => setEsqueci(true)}>Esqueci minha senha</button>
          {!desk && <div className="divider" style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />}
          <button type="button" className={desk ? 'os-btn os-btn--secondary os-btn--desk os-btn--block' : 'os-btn os-btn--block btn-ghost-night'} onClick={() => { setMsg(''); setModo('cadastro'); }}>{desk ? 'Criar conta de professor' : 'Sou novo · Criar conta'}</button>
          {!desk && <button type="button" className="os-btn os-btn--light os-btn--block" onClick={() => { setMsg(''); setFichas(null); setFicha(null); setModo('ja-aluno'); }}>Já é aluno? Faça seu acesso</button>}
          <span style={{ textAlign: 'center', fontSize: 12, color: desk ? 'var(--ink-subtle)' : '#AEB9C5' }}>{desk ? 'Alunos usam o app Oseki BJJ no celular.' : 'Novo aluno? Peça o código da academia ao seu professor. Oss!'}</span>
        </>
      )}
      {modo === 'ja-aluno' && <button type="button" className="link" style={link} onClick={() => { setMsg(''); if (ficha) setFicha(null); else if (fichas) setFichas(null); else setModo('entrar'); }}>Voltar</button>}
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
