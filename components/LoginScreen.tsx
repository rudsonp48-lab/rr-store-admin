'use client';

import React, { useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { btnPrimary, Field, inputCls } from './ui';

function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique sua internet.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail/senha não está ativado no Firebase Authentication.';
    default:
      return err instanceof Error ? err.message : 'Falha ao entrar.';
  }
}

export default function LoginScreen({
  initialError = '',
  onLocalLogin,
}: {
  initialError?: string;
  onLocalLogin?: (email: string) => void;
}) {
  const [email, setEmail] = useState('admin@rrstore.com.br');
  const [password, setPassword] = useState('rrstore2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const cleanEmail = email.trim().toLowerCase();

    // Credencial padrão imediata do painel
    if (
      onLocalLogin &&
      (cleanEmail === 'admin@rrstore.com.br' || cleanEmail === 'admin') &&
      (password === 'rrstore2026' || password === '123456' || password === 'admin123')
    ) {
      onLocalLogin('admin@rrstore.com.br');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Digite seu e-mail para receber o link de redefinição.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Se o e-mail estiver cadastrado, você receberá um link de redefinição.');
    } catch (err) {
      setError(authMessage(err));
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="text-emerald-400" size={22} />
          </div>
          <h1 className="text-lg font-bold">RR Store — Painel</h1>
          <p className="text-xs text-neutral-400">Acesso restrito ao administrador.</p>
        </div>

        <Field label="E-mail">
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200 space-y-0.5">
          <p className="font-semibold text-emerald-300">Credenciais padrão preenchidas:</p>
          <p>Login: <code className="text-white">admin@rrstore.com.br</code></p>
          <p>Senha: <code className="text-white">rrstore2026</code></p>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-3 py-2">
            {info}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
        >
          Esqueci minha senha
        </button>
      </form>
    </div>
  );
}
