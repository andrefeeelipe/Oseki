/*
 * Currículo de exames da Oseki BJJ (tirado dos PDFs "exames_branca/azul/roxa/marrom").
 * Cada faixa tem 40 técnicas. Graus 1 e 2 sorteiam da 1 à 20; graus 3 e 4 da 21 à 40;
 * o exame de troca de faixa sorteia de 1 a 40. Para mudar o currículo, edite este arquivo.
 */
export interface Curriculo {
  tecnicas: string[];
  solo: string[];
  grauSorteio: number;
  grauMedia: number;
  exameSorteio: number | null;
  exameMedia: number | null;
  proxima: string;
}

export const CURRICULO: Record<string, Curriculo> = {
  "Branca": {
    "tecnicas": [
      "Double leg",
      "Single leg",
      "Osotogari",
      "Chamada para a guarda fechada",
      "Armlock da guarda fechada",
      "Triângulo da guarda fechada",
      "Omoplata da guarda fechada",
      "Kimura da guarda fechada",
      "Estrangulamento cruzado da guarda fechada",
      "Raspagem tesoura",
      "Raspagem da guarda fechada com o oponente em pé dominando os tornozelos",
      "Abertura básica de guarda fechada de joelhos",
      "Armlock da montada",
      "Americana da montada",
      "Estrangulamento cruzado da montada",
      "Defesa e saída do armlock da guarda fechada",
      "Defesa e saída do triângulo da guarda fechada",
      "Reposição da montada para a meia guarda",
      "Mataleão",
      "Reposição do 100kg para a guarda fechada",
      "Defesa do single leg com guilhotina (em pé somente a cabeça)",
      "Defesa do double leg para o 4 apoios",
      "Estrangulamento de lapela dos 100kg",
      "Estrangulamento do norte sul",
      "Kimura dos 100kg",
      "Transição dos 100kg para o joelho na barriga + montada",
      "Transição dos 100kg para a montada",
      "Defesa e saída do armlock da montada",
      "Estrangulamento ezequiel",
      "Estrangulamento katagatame",
      "Defesa de omoplata terminando no 100kg",
      "Raspagem de meia guarda",
      "Passagem de meia guarda",
      "Raspagem tripé",
      "Pegada de costas do 4 apoios",
      "Reposição de guarda do 4 apoios",
      "Estrangulamento de gola das costas",
      "Armlock das costas",
      "Saída das costas",
      "Chave de pé reta (ambos fazendo guarda sentada)"
    ],
    "solo": [
      "Amortecimento de costas + levantada técnica",
      "Rolamento de frente e de costas",
      "Fuga de quadril de frente e de costas",
      "Defesa do 4 apoios para as costas",
      "Sprawl para as costas",
      "Entrada de double leg"
    ],
    "grauSorteio": 6,
    "grauMedia": 5,
    "exameSorteio": 12,
    "exameMedia": 6,
    "proxima": "Azul"
  },
  "Azul": {
    "tecnicas": [
      "Kibisu Gaeshi",
      "Ouchi Gari",
      "Collar Drag (em pé)",
      "Reposição do 100kg para guarda fechada girando pra fora",
      "Reposição da meia guarda para guarda fechada",
      "Passagem toureando de um lado para o outro (drill)",
      "Passagem de guarda aberta over-under",
      "Mão de vaca",
      "Omoplata + raspagem de omoplata",
      "Armlock da guarda fechada girando por baixo",
      "Armdrag da guarda borboleta",
      "Estrangulamento rodado da guarda sentada",
      "Raspagem kimura da guarda fechada",
      "Ida para as costas partindo da guarda fechada cruzando a manga",
      "Abertura de guarda fechada em pé + passagem de guarda",
      "Raspagem da meia guarda para o single leg",
      "Raspagem de guarda aranha (oponente de joelhos)",
      "Saída das costas terminando na guarda fechada",
      "Estrangulamento das costas arco e flecha",
      "Triângulo partindo do overhook (esgrimar o braço por trás da axila)",
      "Defesa de triangulo terminando no double under",
      "Raspagem de guarda borboleta terminando montado",
      "Armlock do joelho na barriga",
      "Defesa de omoplata ficando em pé",
      "Transição da meia guarda para a meia guarda profunda",
      "Raspagem da guarda X",
      "Raspagem da guarda one leg",
      "Passagem de guarda partindo do double under",
      "Passagem de guarda aranha",
      "Estrangulamento com a própria lapela dos 100kg",
      "Raspagem da guarda fechada (catucada)",
      "Defesa + passagem da catucada",
      "Saída do Armlock “pedindo carona”",
      "Kimura dos 100kg com variação para o armlock",
      "Americana da montada para o armlock",
      "Quebra de pegada no armlock da montada",
      "Transição da meia guarda para a meia montada",
      "Armlock da montada com variação para o triângulo",
      "Chave de pé reta da guarda one leg x",
      "Defesa da chave de pé reta"
    ],
    "solo": [],
    "grauSorteio": 8,
    "grauMedia": 6,
    "exameSorteio": 15,
    "exameMedia": 7,
    "proxima": "Roxa"
  },
  "Roxa": {
    "tecnicas": [
      "Tomoe Nague",
      "Sumi Gaeshi",
      "Ogoshi",
      "Ippon Seoi Nague ajoelhado",
      "Collar drag para o single leg",
      "Armdrag em pé + cinturada pelas costas + queda travando o calcanhar",
      "Raspagem da meia guarda profunda",
      "Raspagem da guarda sentada partindo da guarda De La Riva",
      "Passagem da meia montada para a montada",
      "Passagem da meia montada para a cruzada de joelho",
      "Pegada de costas partindo do 4 apoios",
      "Estrangulamento relógio",
      "3 variações de mão de vaca",
      "Transição do Katagatame da montada para as costas",
      "Passagem da meia guarda profunda",
      "Passagem de guarda X",
      "Estrangulamento Ezequiel das costas",
      "Drill da guarda aberta para a guarda one leg X",
      "Raspagem da De La Riva invertida",
      "Saída da montada para a guarda borboleta",
      "Raspagem da guarda de laço (oponente de pé)",
      "Ida para as costas da guarda De La Riva invertida",
      "Passagem da meia guarda invertida",
      "Passagem da guarda one leg x",
      "Passagem da guarda de laço",
      "Chave de virilha \"Banana Split\"",
      "Saída das costas para o single leg",
      "Triângulo de mão partindo do 4 apoios",
      "Guilhotina partindo do 4 apoios (cabeça e braço presos)",
      "Defesa da guilhotina do 4 apoios",
      "Estrangulamento do norte sul",
      "Triângulo partindo dos 100kg",
      "Variação do omoplata para o armlock",
      "Omoplata partindo da guarda de laço",
      "Omoplata partindo da meia guarda",
      "Collar drag da guarda sentada",
      "Transição do armlock da montada para as costas",
      "Baratoplata partindo do joelho na barriga",
      "Passagem de guarda aberta - X Pass",
      "Reposição de guarda quando o oponente tenta a X Pass"
    ],
    "solo": [],
    "grauSorteio": 10,
    "grauMedia": 7,
    "exameSorteio": 18,
    "exameMedia": 7.5,
    "proxima": "Marrom"
  },
  "Marrom": {
    "tecnicas": [
      "Kataguruma (de joelhos)",
      "Seoi Nague",
      "Tani Otoshi",
      "Tai Otoshi",
      "Haraigoshi",
      "De Ashi Barai",
      "Raspagem da guarda De La Riva",
      "Raspagem da guarda De La Riva sentada para o single leg",
      "Ida para as costas \"Babybolo\"",
      "Passagem da guarda De La Riva",
      "Passagem de leg drag da guarda De La Riva",
      "Raspagem da guarda de lapela",
      "Passagem da guarda de lapela",
      "Raspagem cadeirinha",
      "Passagem de leg weave partindo da guarda borboleta",
      "Ida para as costas quando o oponente defende a raspagem cadeirinha",
      "Passagem de guarda da De La Riva invertida",
      "Duas maneiras de entrar na guarda one leg x",
      "Passagem da Guarda one leg x para a montada",
      "Passagem da Guarda one leg x para o leg drag",
      "Omoplata partindo do laço e aranha",
      "Raspagem da guarda laçada (catapulta)",
      "Armlock partindo da omoplata com domínio de manga",
      "Entrada de crucixo + finalização com estrangulamento",
      "Triângulo invertido partindo da guarda aberta",
      "Kimura do norte sul com variação para o triângulo invertido",
      "Americana no pé da guarda one leg x",
      "Americana no pé da passagem da guarda aberta",
      "Raspagem da guarda 50/50 (oponente de joelhos)",
      "Raspagem da guarda 50/50 (oponente de pé)",
      "Ida para as costas da guarda 50/50",
      "Passagem da guarda 50/50",
      "Chave de joelho da passagem da guarda aberta",
      "Chave de joelho da passagem da guarda De La Riva",
      "Chave de joelho da passagem de over under",
      "Chave de panturrilha do quatro apoios",
      "Chave de panturrilha da guarda de gancho",
      "Chave de bíceps do controle lateral",
      "Chave de bíceps da guarda de laço",
      "Variação do \"balãozinho\" para o armlock"
    ],
    "solo": [],
    "grauSorteio": 12,
    "grauMedia": 8,
    "exameSorteio": null,
    "exameMedia": null,
    "proxima": "Preta"
  }
};

/** Faixa cujo currículo vale para a faixa do aluno (infantis usam o da branca). */
export function curriculoDe(belt: string): { faixa: string; c: Curriculo } | null {
  if (CURRICULO[belt]) return { faixa: belt, c: CURRICULO[belt] };
  if (belt === 'Preta') return null;
  return { faixa: 'Branca', c: CURRICULO.Branca };
}

/** Faixa de técnicas (1–20, 21–40 ou 1–40) cobrada no próximo passo. */
export function faixaDoSorteio(graus: number): { de: number; ate: number; exameFaixa: boolean } {
  if (graus >= 4) return { de: 1, ate: 40, exameFaixa: true };
  if (graus >= 2) return { de: 21, ate: 40, exameFaixa: false };
  return { de: 1, ate: 20, exameFaixa: false };
}

export const chaveTec = (faixa: string, n: number) => `${faixa}:${n}`;

export function sortear(de: number, ate: number, qtd: number) {
  const nums = Array.from({ length: ate - de + 1 }, (_, i) => de + i);
  for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
  return nums.slice(0, Math.min(qtd, nums.length)).sort((a, b) => a - b);
}
