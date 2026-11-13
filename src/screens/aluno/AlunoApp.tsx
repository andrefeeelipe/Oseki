import { go } from '../../ui/router';
import { TabBar } from '../../ui/kit';
import { useMe } from './common';
import Inicio from './Inicio';
import Presenca from './Presenca';
import Faixa from './Faixa';
import Perfil from './Perfil';
import { Permissao, Grade, QRCheckin, Evolucao, Tecnicas, Exame, Carteirinha, Mensalidade, Regras } from './Subs';
import { Planos, Contrato } from './Planos';
import Ranking from '../shared/Ranking';
import Notificacoes from '../shared/Notificacoes';

export default function AlunoApp({ route }: { route: string[] }) {
  const { db, me } = useMe();
  const tab = route[0] ?? 'inicio';

  if (tab === 'x') {
    const sub = route[1];
    const M: Record<string, JSX.Element> = {
      permissao: <Permissao />, grade: <Grade />, qr: <QRCheckin />, notif: <Notificacoes to={me.id} fallback="aluno/inicio" />,
      evolucao: <Evolucao />, tecnicas: <Tecnicas />, exame: <Exame />, carteirinha: <Carteirinha />, mensalidade: <Mensalidade />,
      regras: <Regras />, planos: <Planos />, contrato: <Contrato />, ranking: <Ranking prof={false} fallback="aluno/inicio" />,
    };
    return M[sub] ?? <Inicio />;
  }

  return (
    <>
      {tab === 'inicio' && <Inicio />}
      {tab === 'presenca' && <Presenca />}
      {tab === 'faixa' && <Faixa />}
      {tab === 'perfil' && <Perfil />}
      <TabBar label="Navegação do aluno" current={tab} items={[
        { id: 'inicio', l: 'Início', icon: 'home', onClick: () => go('aluno/inicio') },
        { id: 'presenca', l: 'Presença', icon: 'cal', onClick: () => go('aluno/presenca') },
        { id: 'faixa', l: 'Faixa', icon: 'belt', onClick: () => go('aluno/faixa') },
        { id: 'perfil', l: 'Perfil', icon: 'user', onClick: () => go('aluno/perfil') },
      ]} />
    </>
  );
}
