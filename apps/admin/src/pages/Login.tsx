import React, { useState } from 'react';
import { api } from '../lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, password);
      if (result.mustChangePassword) {
        window.location.href = '/setup';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', padding: 40, borderRadius: 16, width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #1a7a4c, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 4px 14px rgba(26,122,76,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>M</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>MyAthan Admin</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Sign in to your dashboard</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8,
            marginBottom: 20, fontSize: 13, border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>Email</label>
          <input
            type="text" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="admin@myathan.local"
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10,
              fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#1a7a4c'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Enter your password"
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10,
              fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#1a7a4c'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: 12, background: loading ? '#86efac' : 'linear-gradient(135deg, #1a7a4c, #15803d)',
          color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
