import { useDB, resetDemo, toast } from '../../data/store';
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
        <LinkCard icon="monitor" title="Painel desktop" sub="Abre a versão para computador" onClick={() => go('painel/painel')} />
        <button className="link" style={{ alignSelf: 'center', fontWeight: 600, color: 'var(--ink-subtle)', fontSize: 12, padding: 8 }} onClick={() => { if (confirm('Apagar tudo que foi feito no teste e voltar aos dados de exemplo?')) { resetDemo(); toast('Dados de demonstração restaurados.'); } }}>Restaurar dados de demonstração</button>
      </div>
    </div>
  );
}
