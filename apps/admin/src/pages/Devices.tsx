import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  async function loadDevices() {
    setLoading(true);
    const data = await api.getDevices(page);
    setDevices(data.devices);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => { loadDevices(); }, [page]);

  const filtered = search
    ? devices.filter(d =>
        d.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
        d.lastIp?.includes(search)
      )
    : devices;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Devices</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{total} registered</p>
        </div>
        <input
          type="text"
          placeholder="Search by Device ID or IP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
            width: 260, outline: 'none', background: '#fff',
          }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Device ID</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Firmware</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Last Heartbeat</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>IP Address</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr
                key={d.id}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onClick={() => navigate(`/devices/${d.deviceId}`)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', fontSize: 12 }}>
                  {d.deviceId}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: d.online ? '#dcfce7' : '#f1f5f9',
                    color: d.online ? '#166534' : '#64748b',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.online ? '#22c55e' : '#94a3b8' }} />
                    {d.online ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>
                  {d.firmwareVersion ? `v${d.firmwareVersion}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                  {d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleString() : 'Never'}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                  {d.lastIp || '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/devices/${d.deviceId}`); }}
                    style={{
                      padding: '5px 14px', background: '#eff6ff', color: '#2563eb', border: 'none',
                      borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Manage →
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                {search ? 'No devices match your search' : 'No devices registered'}
              </td></tr>
            )}
          </tbody>
        </table>

        {total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: '#fff' }}>
              ← Prev
            </button>
            <span style={{ padding: '6px 14px', color: '#64748b', fontSize: 12 }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={devices.length < 50}
              style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: '#fff' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
