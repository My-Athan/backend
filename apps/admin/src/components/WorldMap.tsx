import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

declare const L: any;

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

interface MapDevice {
  deviceId: string;
  lat: number;
  lon: number;
  city: string | null;
  country: string | null;
  online: boolean;
  firmwareVersion: string | null;
  lastHeartbeat: string | null;
  wifiRssi: number | null;
  prayerPlaysToday: number;
  groupId: string | null;
}

interface WorldMapProps {
  onDeviceClick?: (deviceId: string) => void;
}

export function WorldMap({ onDeviceClick }: WorldMapProps) {
  const [devices, setDevices] = useState<MapDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.getMapDevices();
      setDevices(data.devices);
      setError('');
    } catch {
      setError('Failed to load device locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(loadDevices, 60000);
    return () => clearInterval(interval);
  }, [loadDevices]);

  // Initialize Leaflet map
  useEffect(() => {
    if (loading || typeof L === 'undefined' || !containerRef.current) return;

    // Destroy previous instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [25, 30],
      zoom: 3,
      zoomControl: true,
    });
    mapRef.current = map;

    // Dark-ish tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const bounds: [number, number][] = [];

    devices.forEach(d => {
      if (d.lat == null || d.lon == null) return;
      bounds.push([d.lat, d.lon]);

      const color = d.online ? '#22c55e' : '#94a3b8';
      const ring = d.online ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.2)';

      const icon = L.divIcon({
        html: `
          <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:${ring};animation:${d.online ? 'pulse 2s infinite' : 'none'}"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative;z-index:1"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      });

      const marker = L.marker([d.lat, d.lon], { icon });

      // Hover tooltip
      const safeId = escapeHtml(d.deviceId);
      const location = [d.city, d.country].filter(Boolean).map(escapeHtml).join(', ') || 'Unknown';
      const lastSeen = d.lastHeartbeat
        ? new Date(d.lastHeartbeat).toLocaleString()
        : 'Never';

      const tooltipHtml = `
        <div style="font-family:system-ui,sans-serif;min-width:180px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
            <span style="font-weight:700;font-size:12px;font-family:monospace">${safeId}</span>
          </div>
          <div style="font-size:11px;color:#374151;display:grid;grid-template-columns:auto 1fr;gap:2px 8px">
            <span style="color:#6b7280">Status</span>
            <span style="font-weight:600;color:${d.online ? '#166534' : '#6b7280'}">${d.online ? 'Online' : 'Offline'}</span>
            <span style="color:#6b7280">Location</span>
            <span>${location}</span>
            <span style="color:#6b7280">Firmware</span>
            <span>${escapeHtml(d.firmwareVersion) ? 'v' + escapeHtml(d.firmwareVersion) : '—'}</span>
            <span style="color:#6b7280">Last seen</span>
            <span>${escapeHtml(lastSeen)}</span>
            ${d.wifiRssi ? `<span style="color:#6b7280">WiFi</span><span>${d.wifiRssi} dBm</span>` : ''}
            <span style="color:#6b7280">Prayers today</span>
            <span>${d.prayerPlaysToday}</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
        opacity: 1,
        className: 'myathan-tooltip',
      });

      // Click popup with actions
      const clickHtml = `
        <div style="font-family:system-ui,sans-serif;min-width:200px">
          <div style="font-weight:700;font-size:13px;font-family:monospace;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">
            ${safeId}
          </div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:12px">
            ${location} &middot; ${escapeHtml(d.firmwareVersion) ? 'v' + escapeHtml(d.firmwareVersion) : 'unknown firmware'}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="window.__mapAction('view','${safeId}')"
              style="padding:6px 10px;font-size:12px;font-weight:600;border:none;border-radius:6px;background:#1a7a4c;color:#fff;cursor:pointer;width:100%">
              Open Device →
            </button>
            <div style="display:flex;gap:4px">
              <button onclick="window.__mapAction('restart','${safeId}')"
                style="flex:1;padding:5px;font-size:11px;font-weight:600;border:1px solid #e5e7eb;border-radius:5px;background:#fff;color:#374151;cursor:pointer">
                Restart
              </button>
              <button onclick="window.__mapAction('wifi_reset','${safeId}')"
                style="flex:1;padding:5px;font-size:11px;font-weight:600;border:1px solid #e5e7eb;border-radius:5px;background:#fff;color:#374151;cursor:pointer">
                WiFi Reset
              </button>
              <button onclick="window.__mapAction('ota_update','${safeId}')"
                style="flex:1;padding:5px;font-size:11px;font-weight:600;border:1px solid #e5e7eb;border-radius:5px;background:#eff6ff;color:#2563eb;cursor:pointer">
                Update
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(clickHtml, { maxWidth: 240, closeButton: false });
      marker.addTo(map);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [devices, loading]);

  // Global action handler
  useEffect(() => {
    (window as any).__mapAction = async (action: string, deviceId: string) => {
      if (action === 'view') {
        if (onDeviceClick) onDeviceClick(deviceId);
        return;
      }
      const labels: Record<string, string> = {
        restart: 'Restart',
        wifi_reset: 'Reset WiFi on',
        ota_update: 'Send firmware update to',
      };
      if (!confirm(`${labels[action] || action} device ${deviceId}?`)) return;
      try {
        await api.sendDeviceCommand(deviceId, action);
        alert(`Command queued. Device will execute on next heartbeat (~5 min).`);
        if (mapRef.current) mapRef.current.closePopup();
      } catch {
        alert('Failed to send command');
      }
    };
    return () => { delete (window as any).__mapAction; };
  }, [onDeviceClick]);

  const onlineCount = devices.filter(d => d.online).length;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(2); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0; }
        }
        .myathan-tooltip {
          background: #fff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .myathan-tooltip::before {
          display: none !important;
        }
        .leaflet-tooltip-top.myathan-tooltip::before {
          border-top-color: #e2e8f0 !important;
        }
      `}</style>

      {/* Map legend */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        background: '#fff', borderRadius: 10, padding: '10px 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)', fontSize: 12,
        display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140,
      }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
          {devices.length} Device{devices.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          {onlineCount} Online
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
          {devices.length - onlineCount} Offline
        </div>
        <button onClick={() => api.getMapDevices().then(d => setDevices(d.devices))} style={{
          marginTop: 4, padding: '4px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6,
          cursor: 'pointer', fontSize: 11, color: '#374151', fontWeight: 500,
        }}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⊕</div>
            <p>Loading device locations...</p>
          </div>
        </div>
      ) : error ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff8f8' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      ) : devices.length === 0 ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', color: '#94a3b8', maxWidth: 320 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⊕</div>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No devices with location data</p>
            <p style={{ fontSize: 13 }}>Devices will appear after they send their first heartbeat with GPS coordinates.</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      )}
    </div>
  );
}
