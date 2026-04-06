import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  async function loadDevices() {
    setLoading(true);
    const data = await api.getDevices(page);
    setDevices(data.devices);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => { loadDevices(); }, [page]);

  async function viewDevice(deviceId: string) {
    const data = await api.getDevice(deviceId);
    setSelected(data);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Devices ({total})</h1>
      </div>

      {/* Device Table */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Device ID</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Firmware</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Last Heartbeat</th>
              <th style={{ textAlign: 'left', padding: 12 }}>IP</th>
              <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>{d.deviceId}</td>
                <td style={{ padding: 12 }}>v{d.firmwareVersion || '?'}</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: d.online ? '#dcfce7' : '#fee2e2', color: d.online ? '#166534' : '#991b1b',
                  }}>
                    {d.online ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td style={{ padding: 12, color: '#666' }}>
                  {d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleString() : 'Never'}
                </td>
                <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{d.lastIp || '-'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button onClick={() => viewDevice(d.deviceId)}
                    style={{ padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Loading...</td></tr>}
            {!loading && devices.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>No devices registered</td></tr>}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Prev</button>
            <span style={{ padding: '6px 12px', color: '#666' }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={devices.length < 50}
              style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Next</button>
          </div>
        )}
      </div>

      {/* Device Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.device.deviceId}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>x</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 20 }}>
              <div><strong>Firmware:</strong> v{selected.device.firmwareVersion}</div>
              <div><strong>Last Heartbeat:</strong> {selected.device.lastHeartbeat ? new Date(selected.device.lastHeartbeat).toLocaleString() : 'Never'}</div>
              <div><strong>IP:</strong> {selected.device.lastIp || '-'}</div>
              <div><strong>Group:</strong> {selected.device.groupId || 'None'}</div>
              <div><strong>Created:</strong> {new Date(selected.device.createdAt).toLocaleDateString()}</div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Config</h3>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 200 }}>
              {JSON.stringify(selected.device.config, null, 2)}
            </pre>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Recent Stats (7 days)</h3>
            {selected.stats?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Date</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Errors</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Uptime</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Heap</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>RSSI</th>
                </tr></thead>
                <tbody>
                  {selected.stats.map((s: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: 6 }}>{new Date(s.date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', padding: 6 }}>{s.errors}</td>
                      <td style={{ textAlign: 'right', padding: 6 }}>{s.uptime ? `${Math.round(s.uptime / 3600)}h` : '-'}</td>
                      <td style={{ textAlign: 'right', padding: 6 }}>{s.freeHeap ? `${Math.round(s.freeHeap / 1024)}KB` : '-'}</td>
                      <td style={{ textAlign: 'right', padding: 6 }}>{s.wifiRssi ?? '-'} dBm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#999', fontSize: 12 }}>No stats collected yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
