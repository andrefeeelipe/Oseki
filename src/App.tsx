import { useEffect } from 'react';
import { useDB } from './data/store';
import { useRoute, go } from './ui/router';
import { Toast } from './ui/kit';
import Login from './screens/Login';
import AlunoApp from './screens/aluno/AlunoApp';
import ProfApp from './screens/prof/ProfApp';
import Desk from './screens/desk/Desk';

export default function App() {
  const db = useDB();
  const r = useRoute();
  const s = db.session;
  const area = r[0] ?? '';

  // Redireciona conforme a sessão
  useEffect(() => {
    if (area === 'painel') return;
    if (!s && area !== 'login') go('login');
    else if (s?.role === 'aluno' && area !== 'aluno') go('aluno/inicio');
    else if ((s?.role === 'prof' || s?.role === 'admin') && area !== 'prof') go('prof/chamada');
  }, [s, area]);

  if (area === 'painel') return <><Desk route={r.slice(1)} /><Toast /></>;

  return (
    <div className="phone os-root">
      {!s && <Login />}
      {s?.role === 'aluno' && area === 'aluno' && <AlunoApp route={r.slice(1)} />}
      {(s?.role === 'prof' || s?.role === 'admin') && area === 'prof' && <ProfApp route={r.slice(1)} />}
      <Toast />
    </div>
  );
}
