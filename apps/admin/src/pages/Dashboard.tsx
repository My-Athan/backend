import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { WorldMap } from '../components/WorldMap';

type View = 'map' | 'list';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [view, setView] = useState<View>('map');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStats(7).then(setStats);
  }, []);

  useEffect(() => {
    if (view === 'list') {
      setLoading(true);
      api.getDevices(page, 50).then(data => {
        setDevices(data.devices);
        setTotalDevices(data.total);
      }).finally(() => setLoading(false));
    }
  }, [view, page]);

  const filtered = search
    ? devices.filter(d =>
        d.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
        d.lastIp?.includes(search)
      )
    : devices;

  const onlineCount = stats?.onlineDevices ?? 0;
  const totalCount = stats?.totalDevices ?? 0;
  const errorCount = stats?.dailyStats?.reduce((s: number, d: any) => s + (d.totalErrors || 0), 0) ?? 0;
  const onlinePct = totalCount ? Math.round((onlineCount / totalCount) * 100) : 0;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Fleet Overview</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
            Real-time view of all MyAthan devices worldwide
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button onClick={() => setView('map')} style={{
            padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: view === 'map' ? '#fff' : 'transparent',
            color: view === 'map' ? '#0f172a' : '#94a3b8',
            boxShadow: view === 'map' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>⊕ Map</button>
          <button onClick={() => setView('list')} style={{
            padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: view === 'list' ? '#fff' : 'transparent',
            color: view === 'list' ? '#0f172a' : '#94a3b8',
            boxShadow: view === 'list' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>☰ List</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        borderBottom: '1px solid #e2e8f0', background: '#fff', flexShrink: 0,
      }}>
        <StatChip label="Total Devices" value={totalCount} accent="#1a7a4c" />
        <StatChip label="Online Now" value={onlineCount} accent="#2563eb" badge={`${onlinePct}%`} />
        <StatChip label="Firmware Versions" value={stats?.firmwareVersions?.length ?? 0} accent="#9333ea" />
        <StatChip label="Errors (7d)" value={errorCount} accent={errorCount > 0 ? '#dc2626' : '#94a3b8'} />
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'map' ? (
          <WorldMap onDeviceClick={(id) => navigate(`/devices/${id}`)} />
        ) : (
          <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
            {/* Search */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by Device ID or IP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                  width: 280, outline: 'none', background: '#fff',
                }}
              />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
                {totalDevices} devices total
              </span>
            </div>

            {/* Device Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Device ID</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Firmware</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Last Seen</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>IP Address</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading devices...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                        {search ? 'No devices match your search' : 'No devices registered yet'}
                      </td>
                    </tr>
                  ) : filtered.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}
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
                          onClick={() => navigate(`/devices/${d.deviceId}`)}
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
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalDevices > 50 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
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
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value, accent, badge }: { label: string; value: number; accent: string; badge?: string }) {
  return (
    <div style={{
      padding: '14px 20px', borderRight: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 4, height: 36, borderRadius: 2, background: accent, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
          {value}
          {badge && <span style={{ fontSize: 12, color: accent, marginLeft: 6, fontWeight: 600 }}>{badge}</span>}
        </p>
      </div>
    </div>
  );
}
