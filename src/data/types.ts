export type BeltName =
  | 'Branca'
  | 'Cinza e Branca' | 'Cinza' | 'Cinza e Preta'
  | 'Amarela e Branca' | 'Amarela' | 'Amarela e Preta'
  | 'Laranja e Branca' | 'Laranja' | 'Laranja e Preta'
  | 'Verde e Branca' | 'Verde' | 'Verde e Preta'
  | 'Azul' | 'Roxa' | 'Marrom' | 'Preta';

export type Grupo = 'Kids' | 'Teens' | 'Adulto';

export interface Note { d: string; t: string; by: string }
export interface HistItem { t: string; d: string }

export type PayStatus = 'pago' | 'aberto' | 'atraso' | 'analise';
export type PlanoId = 'avulso' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type TecnicaNivel = 0 | 1 | 2; // não vista · em treino · aprovada

export interface Student {
  id: string;
  nome: string;
  email: string;
  belt: BeltName;
  graus: number;
  aulas: number; // aulas na faixa/grau atual
  apto: boolean;
  nasc: string; // dd/mm/aaaa
  turma: string; // id da aula principal
  tel: string;
  resp: string;
  foto?: string; // dataURL
  notes: Note[];
  hist: HistItem[];
  desde: string; // mês/ano de início
  matricula: string;
  plano: PlanoId;
  fundador?: number;
  mesesEmDia: number;
  pay: PayStatus;
  payDias?: number; // dias de atraso
  contrato: { assinado: boolean; vig: string; renova: boolean; status: 'ativo' | 'vence' | 'vencido' | 'assin' };
  tecnicas: Record<string, TecnicaNivel>;
  geoAuto: boolean;
  notif: boolean;
  convidado?: boolean;
}

export type AttStatus = 'ok' | 'pend' | 'rej';
export type AttVia = 'gps' | 'qr' | 'app' | 'prof';

export interface Attendance {
  id: string;
  sid: string;
  date: string; // AAAA-MM-DD
  classId: string;
  status: AttStatus;
  via: AttVia;
  at: string; // HH:MM
  sentAt?: string; // quando o aluno enviou (pendentes)
}

export interface Aula {
  id: string;
  nome: string;
  ini: string;
  fim: string;
  dias: number[]; // 0=dom … 6=sáb
  publico: string;
  prof: string;
  vagas: number;
  grupo: Grupo | 'Todos';
}

export interface Notif {
  id: string;
  to: string; // 'prof' ou id do aluno
  t: string;
  d: string;
  at: string; // ISO
  kind: 'pend' | 'gps' | 'meta' | 'pay' | 'nota' | 'grad' | 'aviso' | 'ok' | 'info';
  read: boolean;
}

export interface Tecnica {
  id: string;
  titulo: string;
  cat: string;
  faixaMin: string;
  dur: string;
  desc: string;
  semana?: boolean;
  video?: string;
  novo?: boolean;
}

export interface Access { id: string; h: string; nome: string; meio: string; motivo: string; bloq: boolean; liberado?: boolean }

export interface Settings {
  academia: string;
  equipe: string;
  endereco: string;
  whatsapp: string;
  codigo: string;
  lat: number | null;
  lng: number | null;
  raio: number;
  revisarGps: boolean;
  metodos: { gps: boolean; qr: boolean; app: boolean };
  proximoExame: string;
  planoAula: { tecnica: string; passos: { t: string; d: string; min: number; done: boolean }[] };
  requisitos: Record<string, number>;
  fundadorVagas: number;
  fundadorDesconto: number;
  fundadorTolerancia: number;
  conteudo: Record<string, Record<PlanoId, boolean>>;
  rankingPublicado: boolean;
  dark?: boolean;
}

export interface Session { role: 'aluno' | 'prof' | 'admin'; sid?: string }

export interface DB {
  version: number;
  seededAt: string;
  students: Student[];
  att: Attendance[];
  aulas: Aula[];
  notifs: Notif[];
  tecnicas: Tecnica[];
  access: Access[];
  settings: Settings;
  session: Session | null;
  geoChegada: Record<string, string>; // sid → data do último check-in GPS
  avisos: { id: string; para: string; titulo: string; msg: string; at: string }[];
}
