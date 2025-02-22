'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import '@/app/styles/admin.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ungültige Anmeldedaten');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-box">
        <h1>Admin Login</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Benutzername:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Einloggen
          </button>
        </form>
        <div className="login-footer">
          <button
            onClick={() => router.push('/')}
            className="btn btn-secondary"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}