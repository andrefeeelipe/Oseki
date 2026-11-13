import { useDB } from '../../data/store';
import { LinkCard, Overline } from '../../ui/kit';
import { go } from '../../ui/router';
import { ProfHeader } from './Header';

export default function Mais() {
  const db = useDB();
  const aptos = db.students.filter((s) => s.apto).length;
  const G: [string, [string, string, string, string?][]][] = [
    ['Academia', [['chart', 'Painel', 'painel'], ['belt', 'Graduação', 'graduacao', aptos ? `${aptos} aptos` : undefined], ['cal', 'Grade de aulas', 'grade'], ['list', 'Plano de aula', 'plano'], ['megaphone', 'Comunicado', 'aviso'], ['trophy', 'Ranking', 'ranking']]],
    ['Alunos', [['plus', 'Convidar aluno', 'convidar'], ['star', 'Requisitos por faixa', 'requisitos'], ['video', 'Publicar técnica', 'publicar'], ['door', 'Controle de acesso', 'acesso']]],
    ['Gestão', [['money', 'Financeiro', 'financeiro'], ['doc', 'Contratos', 'contratos'], ['chart', 'Relatórios', 'relatorios'], ['pin', 'Área de presença', 'geo'], ['settings', 'Dados da academia', 'academia'], ['user', 'Meu perfil', 'perfil']]],
  ];
  return (
    <div className="scroll">
      <ProfHeader title="Mais" />
      <div className="pad" style={{ paddingTop: 18 }}>
        {G.map(([g, items]) => (
          <div key={g} className="col-2">
            <Overline>{g}</Overline>
            <div className="menu-grid">
              {items.map(([ic, t, path, sub]) => <LinkCard key={path} icon={ic} title={t} sub={sub} onClick={() => go(`prof/x/${path}`)} right={<></>} />)}
            </div>
          </div>
        ))}
        <LinkCard icon="monitor" title="Painel no computador" sub="Baixe o instalador para Windows na página do app" onClick={() => window.open('https://github.com/andrefeeelipe/Oseki/releases/latest', '_blank')} />
      </div>
    </div>
  );
}
