'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, isAllowedEmail } from '../lib/firebase';
import LoginScreen from './LoginScreen';
import Dashboard from './Dashboard';

const LOCAL_SESSION_KEY = 'rr_store_admin_local_session_v1';

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [localEmail, setLocalEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_SESSION_KEY);
      if (saved) setLocalEmail(saved);
    } catch {
      // ignore
    }

    return onAuthStateChanged(auth, (u) => {
      if (u && !isAllowedEmail(u.email)) {
        setDenied(`O e-mail ${u.email} não tem permissão de administrador.`);
        signOut(auth);
        setUser(null);
      } else {
        if (u) setDenied('');
        setUser(u);
      }
      setReady(true);
    });
  }, []);

  const handleLocalLogin = (email: string) => {
    try {
      window.localStorage.setItem(LOCAL_SESSION_KEY, email);
    } catch {
      // ignore
    }
    setLocalEmail(email);
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      // ignore
    }
    setLocalEmail(null);
    if (user) signOut(auth);
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-neutral-400 text-sm">
        Verificando acesso…
      </div>
    );
  }

  const activeUser = user ?? (localEmail ? ({ email: localEmail } as User) : null);

  if (!activeUser) {
    return <LoginScreen initialError={denied} onLocalLogin={handleLocalLogin} />;
  }
  return <Dashboard user={activeUser} onLogout={handleLogout} />;
}
