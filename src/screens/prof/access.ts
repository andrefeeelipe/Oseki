import type { DB } from '../../data/types';
import { iso, today } from '../../data/util';

export interface Entrada { id: string; sid: string; h: string; nome: string; meio: string; motivo: string; bloq: boolean; liberado: boolean }

/** Entradas de hoje: derivadas das presenças + regras de bloqueio (atraso, contrato). */
export function entradasHoje(db: DB): Entrada[] {
  const hoje = iso(today());
  const lib = new Set(db.access.filter((a) => a.liberado).map((a) => a.id));
  const motivoBloq = (sid: string) => {
    const s = db.students.find((x) => x.id === sid)!;
    if (s.pay === 'atraso' && (s.payDias ?? 0) > db.settings.fundadorTolerancia) return `Mensalidade atrasada ${s.payDias} dias`;
    if (!s.contrato.assinado) return 'Contrato sem assinatura';
    return null;
  };
  const meio = { gps: 'GPS', qr: 'QR', app: 'App', prof: 'Recepção' } as const;
  const list: Entrada[] = db.att.filter((x) => x.date === hoje && x.status !== 'rej').map((x) => {
    const s = db.students.find((y) => y.id === x.sid)!;
    const m = motivoBloq(s.id);
    const id = s.id + hoje;
    return { id, sid: s.id, h: x.at, nome: s.nome, meio: meio[x.via], motivo: m ?? `${s.plano[0].toUpperCase() + s.plano.slice(1)} ativo${s.fundador ? ' · fundador' : ''}`, bloq: !!m, liberado: lib.has(id) };
  });
  return list.sort((a, b) => b.h.localeCompare(a.h));
}
