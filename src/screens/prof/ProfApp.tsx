import { useDB } from '../../data/store';
import { go } from '../../ui/router';
import { TabBar } from '../../ui/kit';
import Chamada from './Chamada';
import Aprovacoes from './Aprovacoes';
import { Alunos, AlunoDetalhe } from './Alunos';
import Mais from './Mais';
import * as P from './Subs';
import * as P2 from './Subs2';
import Ranking from '../shared/Ranking';
import Notificacoes from '../shared/Notificacoes';

export function ProfSub({ sub, id }: { sub?: string; id?: string }) {
  const M: Record<string, () => JSX.Element> = {
    notif: () => <Notificacoes to="prof" fallback="prof/chamada" />,
    ranking: () => <Ranking prof fallback="prof/mais" />,
    painel: () => <P.Painel />, graduacao: () => <P.Graduacao />, aviso: () => <P.Comunicado />, geo: () => <P.AreaGeo />,
    academia: () => <P.Academia />, grade: () => <P.GerenciarGrade />, novaaula: () => <P.NovaAula id={id} />, qr: () => <P.QRAula classId={id} />,
    plano: () => <P2.PlanoAula />, convidar: () => <P2.Convidar />, historico: () => <P2.Historico sid={id} />, avaliacao: () => <P2.Avaliacao sid={id} />,
    requisitos: () => <P2.Requisitos />, publicar: () => <P2.Publicar />, financeiro: () => <P2.Financeiro />, relatorios: () => <P2.Relatorios />,
    perfil: () => <P2.PerfilProf />, contratos: () => <P2.Contratos />, acesso: () => <P2.Acesso />,
  };
  return (M[sub ?? ''] ?? (() => <Mais />))();
}

export default function ProfApp({ route }: { route: string[] }) {
  const db = useDB();
  const tab = route[0] ?? 'chamada';
  const pend = db.att.filter((x) => x.status === 'pend').length;

  if (tab === 'x') return <ProfSub sub={route[1]} id={route[2]} />;
  if (tab === 'aluno') return <AlunoDetalhe sid={route[1]} />;

  return (
    <>
      {tab === 'chamada' && <Chamada />}
      {tab === 'aprovacoes' && <Aprovacoes />}
      {tab === 'alunos' && <Alunos />}
      {tab === 'mais' && <Mais />}
      <TabBar label="Navegação do professor" current={tab} items={[
        { id: 'chamada', l: 'Chamada', icon: 'clip', onClick: () => go('prof/chamada') },
        { id: 'aprovacoes', l: 'Aprovações', icon: 'inbox', badge: pend || undefined, onClick: () => go('prof/aprovacoes') },
        { id: 'alunos', l: 'Alunos', icon: 'users', onClick: () => go('prof/alunos') },
        { id: 'mais', l: 'Mais', icon: 'grid', onClick: () => go('prof/mais') },
      ]} />
    </>
  );
}
