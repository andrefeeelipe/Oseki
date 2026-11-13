import { useState } from 'react';
import { trocarSenha, toast } from '../data/store';
import { Sheet, Field } from './kit';

/** Folha para trocar a senha, com confirmação (digitar duas vezes). */
export function TrocarSenha({ onClose }: { onClose: () => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const salvar = async () => {
    if (a.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.');
    if (a !== b) return toast('As senhas não conferem.');
    setBusy(true); const r = await trocarSenha(a); setBusy(false);
    toast(r ?? 'Senha alterada.');
    if (!r) onClose();
  };
  return (
    <Sheet title="Trocar senha" onClose={onClose}>
      <Field label="Nova senha"><input className="os-input" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} placeholder="mínimo 6 caracteres" /></Field>
      <Field label="Confirme a nova senha"><input className="os-input" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} placeholder="digite a mesma senha" /></Field>
      <button className="os-btn os-btn--primary os-btn--block" disabled={busy} onClick={salvar}>{busy ? 'Aguarde…' : 'Salvar senha'}</button>
    </Sheet>
  );
}
