import type { Student } from '../../data/types';
import { curriculoDe, faixaDoSorteio, chaveTec } from '../../data/curriculo';
import { nextStep } from '../../data/store';

/** O que o próximo passo (grau ou faixa) cobra do aluno, segundo os PDFs de exame. */
export function passoExame(s: Student) {
  const cur = curriculoDe(s.belt);
  if (!cur) return null;
  const { faixa, c } = cur;
  const r = faixaDoSorteio(s.graus);
  const exameFaixa = r.exameFaixa && c.exameSorteio != null;
  const qtd = exameFaixa ? c.exameSorteio! : c.grauSorteio;
  const media = exameFaixa ? c.exameMedia! : c.grauMedia;
  const tecs = c.tecnicas.slice(r.de - 1, r.ate).map((nome, i) => {
    const n = r.de + i;
    return { n, nome, nivel: s.tecnicas[chaveTec(faixa, n)] ?? 0 };
  });
  return { faixa, c, de: r.de, ate: r.ate, qtd, media, exameFaixa, alvo: nextStep(s), tecs };
}
