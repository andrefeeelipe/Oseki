import { useEffect } from 'react';
import { useDB, useAuth } from './data/store';
import { useRoute, go } from './ui/router';
import { Toast } from './ui/kit';
import { Logo } from './ui/Icon';
import { TARGET } from './config';
import Login from './screens/Login';
import AlunoApp from './screens/aluno/AlunoApp';
import ProfApp from './screens/prof/ProfApp';
import Desk from './screens/desk/Desk';

function Splash({ texto }: { texto: string }) {
  return (
    <div className="login os-tatame" style={{ borderRadius: 0, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="logo" style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Logo /></div>
      <span className="t-wordmark" style={{ fontSize: 44 }}>Oseki BJJ</span>
      <span className="on-night-muted" style={{ maxWidth: 300, lineHeight: 1.6 }}>{texto}</span>
    </div>
  );
}

export default function App() {
  const db = useDB();
  const auth = useAuth();
  const r = useRoute();
  const s = db.session;
  const area = r[0] ?? '';
  const pronto = auth === 'pronto' && s;
  const desk = TARGET === 'desktop' || area === 'painel';

  useEffect(() => {
    if (!pronto || desk) return;
    if (s.role === 'aluno' && area !== 'aluno') go('aluno/inicio');
    else if (s.role !== 'aluno' && area !== 'prof') go('prof/chamada');
  }, [pronto, s?.role, area, desk]);

  if (auth === 'sem-servidor') return <Splash texto="O app ainda não foi ligado ao banco de dados da academia. Veja o README do projeto." />;
  if (auth === 'carregando' && !s) return <Splash texto="Carregando…" />;

  if (desk) {
    if (auth === 'deslogado' || auth === 'completar' || auth === 'nova-senha') return <><Login desk modo={auth === 'completar' ? 'completar' : auth === 'nova-senha' ? 'nova-senha' : 'entrar'} /><Toast /></>;
    if (s?.role === 'aluno') return <><Splash texto="O painel é só para professores. Use o app Oseki BJJ no celular." /><Toast /></>;
    return <><Desk route={area === 'painel' ? r.slice(1) : r} /><Toast /></>;
  }

  return (
    <div className="phone os-root">
      {(auth === 'deslogado' || auth === 'completar' || auth === 'nova-senha') && <Login modo={auth === 'completar' ? 'completar' : auth === 'nova-senha' ? 'nova-senha' : 'entrar'} />}
      {pronto && s.role === 'aluno' && area === 'aluno' && <AlunoApp route={r.slice(1)} />}
      {pronto && s.role !== 'aluno' && area === 'prof' && <ProfApp route={r.slice(1)} />}
      <Toast />
    </div>
  );
}
