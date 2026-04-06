import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStats(days).then(setStats).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p>Loading analytics...</p>;

  const maxPlays = Math.max(1, ...(stats?.dailyStats?.map((d: any) => d.totalPlays || 0) || [1]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: days === d ? '#1a7a4c' : '#e5e7eb', color: days === d ? '#fff' : '#555',
              }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, color: '#888' }}>Total Devices</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#1a7a4c' }}>{stats?.totalDevices ?? 0}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, color: '#888' }}>Online Now</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#2563eb' }}>{stats?.onlineDevices ?? 0}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, color: '#888' }}>Online Rate</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#9333ea' }}>
            {stats?.totalDevices ? Math.round((stats.onlineDevices / stats.totalDevices) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Prayer Plays Chart (simple bar chart) */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Prayer Plays</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
          {stats?.dailyStats?.map((d: any, i: number) => {
            const plays = d.totalPlays || 0;
            const height = Math.max(4, (plays / maxPlays) * 100);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#888' }}>{plays}</span>
                <div style={{ width: '100%', height, background: '#1a7a4c', borderRadius: 4, minHeight: 4 }}></div>
                <span style={{ fontSize: 9, color: '#aaa' }}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </div>
            );
          })}
          {(!stats?.dailyStats?.length) && <p style={{ color: '#999', textAlign: 'center', width: '100%' }}>No data yet</p>}
        </div>
      </div>

      {/* Error Trend */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Errors</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {stats?.dailyStats?.map((d: any, i: number) => {
            const errors = d.totalErrors || 0;
            const maxErrors = Math.max(1, ...(stats.dailyStats.map((x: any) => x.totalErrors || 0)));
            const height = Math.max(4, (errors / maxErrors) * 60);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: errors > 0 ? '#dc2626' : '#aaa' }}>{errors}</span>
                <div style={{ width: '100%', height, background: errors > 0 ? '#dc2626' : '#e5e7eb', borderRadius: 4, minHeight: 4 }}></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Firmware Distribution */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Firmware Distribution</h2>
        {stats?.firmwareVersions?.map((v: any) => {
          const pct = stats.totalDevices ? Math.round((v.count / stats.totalDevices) * 100) : 0;
          return (
            <div key={v.version} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>v{v.version || 'unknown'}</span>
                <span style={{ color: '#666' }}>{v.count} ({pct}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 4 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#1a7a4c', borderRadius: 4 }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
