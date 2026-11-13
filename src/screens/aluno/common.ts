import { useEffect, useState } from 'react';
import { useDB } from '../../data/store';
import type { DB, Student, Aula } from '../../data/types';
import { addDays, aulasDoAluno, iso, today, distM } from '../../data/util';

export function useMe() {
  const db = useDB();
  const me = db.students.find((s) => s.id === db.session?.sid) ?? db.students[0];
  return { db, me };
}

/** Próxima aula do aluno a partir de hoje (prioriza a turma dele). */
export function proximaAula(db: DB, s: Student): { aula: Aula; date: Date } | null {
  const minhas = aulasDoAluno(db, s);
  for (let k = 0; k < 8; k++) {
    const d = addDays(today(), k);
    const doDia = minhas.filter((a) => a.dias.includes(d.getDay()));
    const turma = doDia.find((a) => a.id === s.turma);
    if (turma) return { aula: turma, date: d };
    if (k === 0 && doDia.length) return { aula: doDia[0], date: d };
  }
  return null;
}

export const attDe = (db: DB, sid: string, date: string, classId?: string) =>
  db.att.filter((x) => x.sid === sid && x.date === date && (!classId || x.classId === classId)).sort((a, b) => (a.status === 'ok' ? -1 : b.status === 'ok' ? 1 : 0))[0] ?? null;

/** Acompanha a posição do aparelho enquanto ativo. */
export function useGeo(active: boolean, lat: number | null, lng: number | null) {
  const [dist, setDist] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!active || lat == null || lng == null) return;
    if (!('geolocation' in navigator)) { setErr('Este aparelho não tem GPS disponível.'); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setErr(null); setDist(distM(p.coords.latitude, p.coords.longitude, lat, lng)); },
      (e) => setErr(e.code === 1 ? 'Permissão de localização negada.' : 'Não foi possível obter a localização.'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active, lat, lng]);
  return { dist, err };
}

export const todayIso = () => iso(today());
