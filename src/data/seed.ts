import type { DB, Student, Attendance, Aula, AttVia, PlanoId, BeltName } from './types';
import { addDays, iso, today, hhmm, MES, br } from './util';

/* Gerador determinístico para os dados de demonstração ficarem iguais em todo aparelho */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const AULAS: Aula[] = [
  { id: 'c1', nome: 'Teens 11–15', ini: '18:00', fim: '19:00', dias: [1, 3, 4], publico: 'Teens 11–15', prof: 'Prof. Marangoni', vagas: 20, grupo: 'Teens' },
  { id: 'c2', nome: 'Gi · todos os níveis', ini: '19:30', fim: '21:00', dias: [1, 2, 4], publico: 'Adulto', prof: 'Prof. Marangoni', vagas: 30, grupo: 'Adulto' },
  { id: 'c3', nome: 'Fundamentos', ini: '07:00', fim: '08:00', dias: [2, 5], publico: 'Adulto · iniciantes', prof: 'Prof. Oseki', vagas: 20, grupo: 'Adulto' },
  { id: 'c4', nome: 'Kids 4–10', ini: '17:00', fim: '17:50', dias: [2, 4], publico: 'Kids 4–10', prof: 'Prof. Oseki', vagas: 16, grupo: 'Kids' },
  { id: 'c5', nome: 'No-Gi', ini: '19:30', fim: '20:30', dias: [3, 5], publico: 'Adulto', prof: 'Prof. Oseki', vagas: 24, grupo: 'Adulto' },
  { id: 'c6', nome: 'Open mat', ini: '10:00', fim: '12:00', dias: [6], publico: 'Todos os alunos', prof: 'Prof. Marangoni', vagas: 40, grupo: 'Todos' },
];

type Raw = [string, string, string, BeltName, number, number, boolean, string, PlanoId, number | undefined, number, Student['pay'], number, Student['contrato']['status'], string];
// id, nome, nasc, faixa, graus, aulas, apto, turma, plano, fundador, meses em dia, pagamento, prob. de presença, contrato, desde
const RAW: Raw[] = [
  ['s1', 'Lucas Ferreira', '20/05/2012', 'Cinza e Branca', 2, 18, false, 'c1', 'trimestral', 12, 8, 'pago', 0.82, 'ativo', 'mar 2025'],
  ['s2', 'Júlia Mendes', '03/02/2014', 'Amarela', 4, 19, true, 'c1', 'mensal', 21, 6, 'pago', 0.91, 'vence', 'jan 2024'],
  ['s3', 'Marina Souza', '14/08/1999', 'Azul', 3, 52, false, 'c2', 'anual', 3, 11, 'pago', 0.88, 'ativo', 'fev 2021'],
  ['s4', 'Pedro Lima', '09/11/1995', 'Branca', 1, 14, false, 'c2', 'mensal', undefined, 2, 'aberto', 0.64, 'vence', 'jun 2026'],
  ['s5', 'Rafael Costa', '22/04/1992', 'Roxa', 0, 8, false, 'c2', 'semestral', 7, 9, 'pago', 0.76, 'vence', 'mai 2019'],
  ['s6', 'Thiago Alves', '30/01/1988', 'Marrom', 2, 33, false, 'c2', 'mensal', 15, 4, 'atraso', 0.58, 'vencido', 'ago 2017'],
  ['s7', 'Beatriz Rocha', '11/07/2004', 'Branca', 4, 39, true, 'c2', 'anual', 1, 12, 'pago', 0.95, 'ativo', 'out 2025'],
  ['s8', 'Carla Teixeira', '05/03/1996', 'Roxa', 3, 41, false, 'c2', 'trimestral', 9, 7, 'pago', 0.86, 'ativo', 'abr 2020'],
  ['s9', 'Matheus Pires', '17/09/2011', 'Verde', 3, 15, false, 'c1', 'mensal', undefined, 5, 'pago', 0.8, 'ativo', 'mar 2023'],
  ['s10', 'Felipe Ramos', '28/12/1990', 'Azul', 3, 44, false, 'c2', 'trimestral', 18, 7, 'aberto', 0.7, 'ativo', 'set 2022'],
  ['s11', 'Ana Clara Dias', '02/06/2018', 'Cinza', 2, 12, false, 'c4', 'mensal', undefined, 3, 'pago', 0.62, 'ativo', 'fev 2025'],
  ['s12', 'Sofia Lima', '19/10/2013', 'Laranja', 2, 13, false, 'c1', 'semestral', 27, 6, 'pago', 0.72, 'ativo', 'jul 2023'],
  ['s13', 'Gabriel Nunes', '25/02/2000', 'Branca', 0, 3, false, 'c2', 'avulso', undefined, 0, 'aberto', 0.35, 'assin', 'nov 2026'],
];

export function buildSeed(): DB {
  const r = rng(20261112);
  const t0 = today();
  const students: Student[] = RAW.map((x, i) => ({
    id: x[0], nome: x[1], email: x[1].split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@demo.oseki',
    nasc: x[2], belt: x[3], graus: x[4], aulas: x[5], apto: x[6], turma: x[7], plano: x[8], fundador: x[9], mesesEmDia: x[10], pay: x[11],
    payDias: x[11] === 'atraso' ? 28 : undefined,
    tel: `(11) 9${8700 + i * 37}-${4321 + i * 113}`.slice(0, 15), resp: '', notes: [], hist: [], desde: x[14],
    matricula: String(184 + i * 7).padStart(6, '0'),
    contrato: { assinado: x[13] !== 'assin', vig: x[13] === 'vencido' ? 'venceu ' + br(addDays(t0, -30)).slice(0, 5) : x[13] === 'vence' ? 'vence ' + br(addDays(t0, 17)).slice(0, 5) : 'até 31/12/' + t0.getFullYear(), renova: x[13] !== 'vencido', status: x[13] },
    tecnicas: {}, geoAuto: true, notif: true,
  }));

  const lucas = students[0];
  lucas.tel = '(11) 98765-4321';
  lucas.resp = 'Ana Ferreira · (11) 91234-5678';
  lucas.email = 'lucas@demo.oseki';
  lucas.notes = [
    { d: br(addDays(t0, -8)), t: 'Boa evolução na fuga de montada. Continue treinando a ponte com quadril alto.', by: 'Prof. Marangoni' },
    { d: br(addDays(t0, -29)), t: 'Melhorar a postura na guarda fechada. O quadril está muito baixo.', by: 'Prof. Marangoni' },
  ];
  lucas.hist = [
    { t: '2º grau', d: 'set 2026' }, { t: '1º grau', d: 'jun 2026' }, { t: 'Faixa cinza e branca', d: 'fev 2026' }, { t: 'Início no Jiu-Jitsu', d: 'mar 2025' },
  ];
  lucas.tecnicas = { t1: 2, t2: 2, t3: 2, t4: 1, t5: 1, t6: 1 };
  students[1].resp = 'Cláudia Mendes · (11) 99876-1122';
  students[10].resp = 'Rodrigo Dias · (11) 97777-3344';
  for (const s of students) if (!s.hist.length) s.hist = [{ t: `Faixa ${s.belt.toLowerCase()}`, d: s.desde }, { t: 'Início no Jiu-Jitsu', d: s.desde }];

  /* Presenças dos últimos 150 dias */
  const att: Attendance[] = [];
  let n = 0;
  const vias: AttVia[] = ['gps', 'gps', 'gps', 'qr', 'prof'];
  const add = (sid: string, d: Date, classId: string, status: Attendance['status'], via: AttVia, at: string, sentAt?: string) =>
    att.push({ id: 'a' + n++, sid, date: iso(d), classId, status, via, at, sentAt });
  for (let k = 150; k >= 1; k--) {
    const d = addDays(t0, -k);
    const wd = d.getDay();
    students.forEach((s, i) => {
      const p = RAW[i][12];
      if (s.id === 's6' && k <= 9) return; // Thiago sumiu há 9 dias
      if (s.id === 's13' && k > 14) return; // Gabriel começou agora
      if (s.id === 's4' && k > 140) return;
      for (const a of AULAS) {
        if (!a.dias.includes(wd)) continue;
        let prob = 0;
        if (a.id === s.turma) prob = p;
        else if (a.grupo === 'Todos') prob = p * 0.3;
        else if (a.grupo === 'Adulto' && AULAS.find((x) => x.id === s.turma)?.grupo === 'Adulto') prob = p * 0.22;
        if (prob && r() < prob) {
          const [h, m] = a.ini.split(':').map(Number);
          const mm = Math.max(0, m - 3 - Math.floor(r() * 20));
          add(s.id, d, a.id, 'ok', vias[Math.floor(r() * vias.length)], `${String(mm < m ? h : h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
        }
      }
    });
  }

  /* Marcações pendentes (alunos que esqueceram o GPS) e uma recusada */
  const ultimo = (dias: number[], from: number) => { for (let k = from; k < 30; k++) { const d = addDays(t0, -k); if (dias.includes(d.getDay())) return d; } return addDays(t0, -from); };
  const pend = (sid: string, classId: string, from: number) => {
    const a = AULAS.find((x) => x.id === classId)!;
    const d = ultimo(a.dias, from);
    for (let i = att.length - 1; i >= 0; i--) if (att[i].sid === sid && att[i].date === iso(d)) att.splice(i, 1);
    add(sid, d, classId, 'pend', 'app', a.ini, br(d).slice(0, 5) + ' ' + a.fim);
  };
  pend('s1', 'c6', 1);
  pend('s3', 'c3', 1);
  pend('s4', 'c2', 0);
  const rejD = ultimo([1, 3, 4], 10);
  for (let i = att.length - 1; i >= 0; i--) if (att[i].sid === 's1' && att[i].date === iso(rejD)) att.splice(i, 1);
  add('s1', rejD, 'c1', 'rej', 'app', '18:00');

  /* Chegadas por GPS de hoje, se houver aula */
  const now = new Date();
  for (const a of AULAS) {
    if (!a.dias.includes(t0.getDay())) continue;
    const [h, m] = a.ini.split(':').map(Number);
    const inicio = new Date(t0); inicio.setHours(h, m - 20);
    if (now < inicio) continue;
    const quem: Record<string, string[]> = { Teens: ['s2', 's9', 's12'], Adulto: ['s3', 's5', 's7', 's8', 's10'], Kids: ['s11'], Todos: ['s3', 's7', 's2'] };
    const lista = (quem[a.grupo] ?? []).filter((_, i) => a.id === 'c2' || a.id === 'c1' || i % 2 === (a.id === 'c3' ? 0 : 1));
    lista.map((id) => students.find((s) => s.id === id)!).forEach((s, i) => {
      if (!att.some((x) => x.sid === s.id && x.date === iso(t0) && x.classId === a.id)) add(s.id, t0, a.id, 'ok', i % 3 === 2 ? 'prof' : 'gps', `${String(m < 10 ? h - 1 : h).padStart(2, '0')}:${String((m + 52 + i) % 60).padStart(2, '0')}`);
    });
  }

  const nowIso = new Date().toISOString();
  const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

  return {
    version: 1,
    seededAt: nowIso,
    students,
    att,
    aulas: AULAS,
    notifs: [
      { id: 'n1', to: 'prof', t: 'Pedro Lima marcou presença', d: 'Gi · todos os níveis. Toque para aprovar.', at: ago(40), kind: 'pend', read: false },
      { id: 'n2', to: 'prof', t: 'Alunos chegaram por GPS', d: 'Teens 11–15: Júlia, Matheus e mais 2.', at: ago(95), kind: 'gps', read: false },
      { id: 'n3', to: 'prof', t: 'Júlia Mendes bateu a meta', d: '19 de 20 aulas na faixa amarela. Quase pronta para graduar.', at: ago(96), kind: 'meta', read: false },
      { id: 'n4', to: 'prof', t: 'Mensalidade em atraso', d: 'Thiago Alves está com a mensalidade em aberto há 28 dias.', at: ago(600), kind: 'pay', read: false },
      { id: 'n5', to: 'prof', t: 'Aniversário amanhã', d: 'Pedro Lima faz aniversário. Mande um Oss!', at: ago(60 * 26), kind: 'info', read: true },
      { id: 'n6', to: 's1', t: 'Nova anotação do professor', d: 'Boa evolução na fuga de montada. Continue treinando a ponte com quadril alto.', at: ago(60 * 24 * 8), kind: 'nota', read: false },
      { id: 'n7', to: 's1', t: 'Presença aprovada', d: 'Teens 11–15 · presença confirmada pelo professor.', at: ago(60 * 24 * 3), kind: 'ok', read: false },
      { id: 'n8', to: 's1', t: 'Mensalidade paga', d: 'Recebemos seu Pix. Oss!', at: ago(60 * 24 * 5), kind: 'pay', read: true },
      { id: 'n9', to: 's1', t: 'Posição da semana', d: 'Raspagem da De La Riva para as costas. Assista antes da aula.', at: ago(60 * 24 * 4), kind: 'aviso', read: true },
    ],
    tecnicas: [
      { id: 't1', titulo: 'Fuga de montada (upa)', cat: 'Defesa', faixaMin: 'Branca', dur: '4 min', desc: 'Ponte com o quadril alto e prenda o braço do mesmo lado.' },
      { id: 't2', titulo: 'Passagem de guarda básica', cat: 'Passagem', faixaMin: 'Branca', dur: '5 min', desc: 'Postura, abertura da guarda fechada e passagem por baixo da perna.' },
      { id: 't3', titulo: 'Raspagem tesoura', cat: 'Raspagem', faixaMin: 'Branca', dur: '4 min', desc: 'Da guarda fechada aberta, pegada na gola e na manga.' },
      { id: 't4', titulo: 'Armlock da montada', cat: 'Finalização', faixaMin: 'Branca', dur: '6 min', desc: 'Isolar o braço, girar o quadril e fechar os joelhos.' },
      { id: 't5', titulo: 'Queda: o-soto-gari', cat: 'Quedas', faixaMin: 'Branca', dur: '5 min', desc: 'Desequilíbrio para trás e ceifada da perna de apoio.' },
      { id: 't6', titulo: 'Defesa de estrangulamento', cat: 'Defesa', faixaMin: 'Branca', dur: '3 min', desc: 'Proteja o pescoço com as mãos e gire para o lado da pegada.' },
      { id: 't7', titulo: 'Raspagem da De La Riva para as costas', cat: 'Raspagem', faixaMin: 'Azul', dur: '6 min', desc: 'Transição da guarda De La Riva para a pegada das costas.', semana: true },
      { id: 't8', titulo: 'Guarda aranha: controle e raspagem', cat: 'Guarda', faixaMin: 'Azul', dur: '7 min', desc: 'Pés no bíceps, pegada nas mangas e raspagem de balão.' },
      { id: 't9', titulo: 'Kimura da meia-guarda', cat: 'Finalização', faixaMin: 'Roxa', dur: '5 min', desc: 'Pegada figura-quatro e saída para as costas.' },
    ],
    access: [],
    settings: {
      academia: 'Oseki BJJ',
      equipe: 'Marangoni BJJ / Oseki BJJ',
      endereco: '[ENDEREÇO DA ACADEMIA]',
      whatsapp: '(11) [WHATSAPP]',
      codigo: 'OSEKI-2026',
      lat: null, lng: null, raio: 100, revisarGps: false,
      metodos: { gps: true, qr: true, app: true },
      proximoExame: iso(addDays(t0, 29)),
      planoAula: {
        tecnica: 'Raspagem da De La Riva para as costas',
        passos: [
          { t: 'Aquecimento', d: 'Fuga de quadril, rolamentos e ponte', min: 10, done: true },
          { t: 'Técnica', d: 'Pegada De La Riva e desequilíbrio', min: 15, done: true },
          { t: 'Drill', d: 'Raspagem e pegada das costas, 3 × 10 cada lado', min: 15, done: false },
          { t: 'Treino específico', d: 'Começando na De La Riva, 3 min', min: 12, done: false },
          { t: 'Rola livre', d: '5 rounds de 5 min', min: 25, done: false },
        ],
      },
      requisitos: { 'Branca': 40, 'Cinza e Branca': 20, 'Amarela': 20, 'Laranja': 20, 'Verde': 20, 'Azul': 60, 'Roxa': 60, 'Marrom': 60, 'Preta': 80 },
      fundadorVagas: 50, fundadorDesconto: 15, fundadorTolerancia: 10,
      conteudo: {
        'Biblioteca de técnicas': { avulso: false, mensal: true, trimestral: true, semestral: true, anual: true },
        'Posição da semana': { avulso: true, mensal: true, trimestral: true, semestral: true, anual: true },
        'Open mat de sábado': { avulso: false, mensal: false, trimestral: true, semestral: true, anual: true },
        'Aulas de competição': { avulso: false, mensal: false, trimestral: true, semestral: true, anual: true },
        'Seminários gravados': { avulso: false, mensal: false, trimestral: false, semestral: true, anual: true },
        'Plano de treino individual': { avulso: false, mensal: false, trimestral: false, semestral: false, anual: true },
      },
      rankingPublicado: false,
    },
    session: null,
    geoChegada: {},
    avisos: [],
  };
}

export const PLANOS: { id: PlanoId; nome: string; desc: string; per: string; meses: number }[] = [
  { id: 'avulso', nome: 'Avulso', desc: 'Aula única ou pacote · sem fidelidade', per: 'por aula', meses: 0 },
  { id: 'mensal', nome: 'Mensal', desc: 'Aulas ilimitadas · cancele quando quiser', per: 'por mês', meses: 1 },
  { id: 'trimestral', nome: 'Trimestral', desc: '3 meses · + open mat e competição', per: 'por mês', meses: 3 },
  { id: 'semestral', nome: 'Semestral', desc: '6 meses · + seminários gravados', per: 'por mês', meses: 6 },
  { id: 'anual', nome: 'Anual', desc: '12 meses · tudo liberado + treino individual', per: 'por mês', meses: 12 },
];
export const planoNome = (id: PlanoId) => PLANOS.find((p) => p.id === id)?.nome ?? id;
export { MES, hhmm };
