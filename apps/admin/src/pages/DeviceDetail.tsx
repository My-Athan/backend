import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type CommandStatus = 'idle' | 'sending' | 'sent' | 'error';

export function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configJson, setConfigJson] = useState('');
  const [configError, setConfigError] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [cmdStatus, setCmdStatus] = useState<Record<string, CommandStatus>>({});
  const [activeTab, setTab] = useState<'info' | 'config' | 'stats' | 'commands'>('info');

  useEffect(() => {
    if (!deviceId) return;
    Promise.all([
      api.getDevice(deviceId),
      api.getDeviceCommands(deviceId),
    ]).then(([d, c]) => {
      setDevice(d.device);
      setStats(d.stats);
      setConfigJson(JSON.stringify(d.device.config || {}, null, 2));
      setCommands(c.commands);
    }).catch(() => navigate('/devices')).finally(() => setLoading(false));
  }, [deviceId, navigate]);

  async function saveConfig() {
    if (!deviceId) return;
    setConfigError('');
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(configJson);
    } catch {
      setConfigError('Invalid JSON — please fix syntax errors before saving.');
      return;
    }
    setSavingConfig(true);
    try {
      await api.updateDeviceConfig(deviceId, parsed);
      setConfigError('✓ Config saved successfully');
    } catch (err: any) {
      setConfigError(`Error: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  }

  async function sendCommand(command: string, payload?: Record<string, unknown>) {
    if (!deviceId) return;
    const confirmMessages: Record<string, string> = {
      restart: `Restart device ${deviceId}?`,
      wifi_reset: `Reset WiFi on ${deviceId}? Device will need re-provisioning.`,
      ota_update: `Send OTA update command to ${deviceId}?`,
    };
    if (!confirm(confirmMessages[command] || `Send "${command}" to ${deviceId}?`)) return;
    setCmdStatus(s => ({ ...s, [command]: 'sending' }));
    try {
      await api.sendDeviceCommand(deviceId, command, payload);
      setCmdStatus(s => ({ ...s, [command]: 'sent' }));
      // Refresh command list
      api.getDeviceCommands(deviceId).then(c => setCommands(c.commands));
      setTimeout(() => setCmdStatus(s => ({ ...s, [command]: 'idle' })), 3000);
    } catch {
      setCmdStatus(s => ({ ...s, [command]: 'error' }));
      setTimeout(() => setCmdStatus(s => ({ ...s, [command]: 'idle' })), 3000);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#94a3b8' }}>Loading device...</p>
      </div>
    );
  }

  if (!device) return null;

  const online = device.lastHeartbeat
    ? new Date(device.lastHeartbeat) > new Date(Date.now() - 5 * 60 * 1000)
    : false;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0, marginBottom: 12,
        }}>
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
              {device.deviceId}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: online ? '#dcfce7' : '#f1f5f9',
                color: online ? '#166534' : '#64748b',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? '#22c55e' : '#94a3b8' }} />
                {online ? 'Online' : 'Offline'}
              </span>
              {device.firmwareVersion && (
                <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
                  v{device.firmwareVersion}
                </span>
              )}
              {device.hardwareType && (
                <span style={{ fontSize: 12, color: '#64748b' }}>{device.hardwareType}</span>
              )}
            </div>
          </div>

          {/* Quick commands */}
          <div style={{ display: 'flex', gap: 8 }}>
            <CommandButton label="Restart" command="restart" status={cmdStatus.restart} onSend={sendCommand} color="#374151" bg="#f1f5f9" />
            <CommandButton label="WiFi Reset" command="wifi_reset" status={cmdStatus.wifi_reset} onSend={sendCommand} color="#92400e" bg="#fef3c7" />
            <CommandButton label="OTA Update" command="ota_update" status={cmdStatus.ota_update} onSend={sendCommand} color="#1e40af" bg="#dbeafe" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        {(['info', 'config', 'stats', 'commands'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 600 : 400,
            color: activeTab === t ? '#1a7a4c' : '#64748b',
            borderBottom: activeTab === t ? '2px solid #1a7a4c' : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize',
          }}>
            {t === 'info' ? 'Device Info' : t === 'config' ? 'Configuration' : t === 'stats' ? 'Statistics' : 'Commands'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <InfoCard title="Device Identity">
            <InfoRow label="Device ID" value={device.deviceId} mono />
            <InfoRow label="Hardware" value={device.hardwareType || '—'} />
            <InfoRow label="Firmware" value={device.firmwareVersion ? `v${device.firmwareVersion}` : '—'} />
            <InfoRow label="Registered" value={new Date(device.createdAt).toLocaleDateString()} />
          </InfoCard>

          <InfoCard title="Connectivity">
            <InfoRow label="Status" value={online ? 'Online' : 'Offline'} accent={online ? '#166534' : '#64748b'} />
            <InfoRow label="Last Heartbeat" value={device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString() : 'Never'} />
            <InfoRow label="IP Address" value={device.lastIp || '—'} mono />
            <InfoRow label="Group" value={device.groupId || 'None'} mono={!!device.groupId} />
          </InfoCard>

          {(device.lat || device.city) && (
            <InfoCard title="Location">
              <InfoRow label="City" value={device.city || '—'} />
              <InfoRow label="Country" value={device.country || '—'} />
              {device.lat && <InfoRow label="Coordinates" value={`${device.lat?.toFixed(4)}, ${device.lon?.toFixed(4)}`} mono />}
            </InfoCard>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Edit device configuration (JSON). Only allowed keys: audio, schedule, ramadan, hijri, holidays, led, multiRoom, location, timetable.
            </p>
            <button onClick={saveConfig} disabled={savingConfig} style={{
              padding: '8px 20px', background: '#1a7a4c', color: '#fff', border: 'none',
              borderRadius: 8, cursor: savingConfig ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {savingConfig ? 'Saving...' : 'Save Config'}
            </button>
          </div>

          {configError && (
            <div style={{
              padding: '8px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
              background: configError.startsWith('✓') ? '#dcfce7' : '#fef2f2',
              color: configError.startsWith('✓') ? '#166534' : '#dc2626',
              border: `1px solid ${configError.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {configError}
            </div>
          )}

          <textarea
            value={configJson}
            onChange={e => setConfigJson(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%', height: 480, fontFamily: 'monospace', fontSize: 12,
              padding: 16, border: '1px solid #e2e8f0', borderRadius: 10, resize: 'vertical',
              background: '#1e293b', color: '#e2e8f0', outline: 'none', lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Errors</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Uptime</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>Free Heap</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#64748b' }}>WiFi RSSI</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No stats collected yet</td>
                </tr>
              ) : stats.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>{new Date(s.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: s.errors > 0 ? '#dc2626' : '#374151' }}>{s.errors ?? 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>
                    {s.uptime ? `${Math.round(s.uptime / 3600)}h ${Math.round((s.uptime % 3600) / 60)}m` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>
                    {s.freeHeap ? `${Math.round(s.freeHeap / 1024)} KB` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: getRssiColor(s.wifiRssi) }}>
                    {s.wifiRssi != null ? `${s.wifiRssi} dBm` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'commands' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <CommandButton label="Send Restart" command="restart" status={cmdStatus.restart} onSend={sendCommand} color="#374151" bg="#f1f5f9" />
            <CommandButton label="Reset WiFi" command="wifi_reset" status={cmdStatus.wifi_reset} onSend={sendCommand} color="#92400e" bg="#fef3c7" />
            <CommandButton label="Force OTA Update" command="ota_update" status={cmdStatus.ota_update} onSend={sendCommand} color="#1e40af" bg="#dbeafe" />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
              Command History
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600, color: '#64748b' }}>Command</th>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600, color: '#64748b' }}>Queued</th>
                  <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600, color: '#64748b' }}>Delivered</th>
                </tr>
              </thead>
              <tbody>
                {commands.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No commands sent yet</td></tr>
                ) : commands.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>{c.command}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: c.status === 'executed' ? '#dcfce7' : c.status === 'delivered' ? '#dbeafe' : '#fef3c7',
                        color: c.status === 'executed' ? '#166534' : c.status === 'delivered' ? '#1e40af' : '#92400e',
                      }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>
                      {c.deliveredAt ? new Date(c.deliveredAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
        {title}
      </div>
      <div style={{ padding: '4px 0' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : undefined, fontWeight: 500, color: accent || '#0f172a', fontSize: mono ? 12 : 13 }}>
        {value}
      </span>
    </div>
  );
}

function CommandButton({ label, command, status, onSend, color, bg }: {
  label: string; command: string; status?: CommandStatus; onSend: (cmd: string) => void;
  color: string; bg: string;
}) {
  const s = status || 'idle';
  return (
    <button onClick={() => onSend(command)} disabled={s === 'sending'} style={{
      padding: '8px 16px', background: s === 'sent' ? '#dcfce7' : s === 'error' ? '#fef2f2' : bg,
      color: s === 'sent' ? '#166534' : s === 'error' ? '#dc2626' : color,
      border: 'none', borderRadius: 8, cursor: s === 'sending' ? 'not-allowed' : 'pointer',
      fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
    }}>
      {s === 'sending' ? '...' : s === 'sent' ? '✓ Sent' : s === 'error' ? '✗ Failed' : label}
    </button>
  );
}

function getRssiColor(rssi: number | null): string {
  if (rssi == null) return '#94a3b8';
  if (rssi >= -60) return '#166534';
  if (rssi >= -75) return '#92400e';
  return '#dc2626';
}
