'use client';

import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Loader2, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { btnGhost, btnPrimary, Field, inputCls } from './ui';

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
      try {
        await signInAnonymously(auth);
      } catch {
        // Fallback local se autenticação anônima não estiver ligada no console
      }
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

  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Entrar com Senha'}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-neutral-950 px-2 text-neutral-500 font-semibold">Ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`${btnGhost} w-full text-xs font-semibold !py-2.5 hover:border-emerald-500/40 hover:text-white`}
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Entrar com Google (rudson.p48@gmail.com)
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
