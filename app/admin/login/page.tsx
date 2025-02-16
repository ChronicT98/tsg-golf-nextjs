'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/styles/admin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple password check - this should be replaced with proper authentication
    if (password === 'TSG2024!') {
      // Set authentication state
      sessionStorage.setItem('adminAuthenticated', 'true');
      router.push('/admin');
    } else {
      setError('Falsches Passwort');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-box">
        <h1>Admin Login</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              autoComplete="new-password"
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