import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats(7).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Devices" value={stats?.totalDevices ?? 0} color="#1a7a4c" />
        <StatCard label="Online Now" value={stats?.onlineDevices ?? 0} color="#2563eb" />
        <StatCard label="Firmware Versions" value={stats?.firmwareVersions?.length ?? 0} color="#9333ea" />
        <StatCard label="Errors (7d)" value={stats?.dailyStats?.reduce((s: number, d: any) => s + (d.totalErrors || 0), 0) ?? 0} color="#dc2626" />
      </div>

      {/* Firmware Version Distribution */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Firmware Versions</h2>
        {stats?.firmwareVersions?.map((v: any) => (
          <div key={v.version} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontFamily: 'monospace' }}>v{v.version || 'unknown'}</span>
            <span style={{ fontWeight: 600 }}>{v.count} devices</span>
          </div>
        ))}
        {(!stats?.firmwareVersions?.length) && <p style={{ color: '#999' }}>No data yet</p>}
      </div>

      {/* Daily Stats */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Activity (7 days)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Prayer Plays</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Errors</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Avg Uptime</th>
            </tr>
          </thead>
          <tbody>
            {stats?.dailyStats?.map((d: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 8 }}>{new Date(d.date).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{d.totalPlays ?? 0}</td>
                <td style={{ textAlign: 'right', padding: 8, color: d.totalErrors > 0 ? '#dc2626' : '#666' }}>{d.totalErrors ?? 0}</td>
                <td style={{ textAlign: 'right', padding: 8 }}>{d.avgUptime ? `${Math.round(d.avgUptime / 3600)}h` : '-'}</td>
              </tr>
            ))}
            {(!stats?.dailyStats?.length) && <tr><td colSpan={4} style={{ padding: 16, color: '#999', textAlign: 'center' }}>No data yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}
