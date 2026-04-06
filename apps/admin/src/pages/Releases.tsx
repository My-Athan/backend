import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function Releases() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReleases() {
    setLoading(true);
    const data = await api.getReleases();
    setReleases(data.releases);
    setLoading(false);
  }

  useEffect(() => { loadReleases(); }, []);

  async function handleRollout(version: string, percent: number) {
    await api.updateRelease(version, { rolloutPercent: percent });
    loadReleases();
  }

  async function handleMarkStable(version: string) {
    await api.updateRelease(version, { isStable: true, rolloutPercent: 100 });
    loadReleases();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Firmware Releases</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Releases are uploaded via GitHub Actions CI when you push a version tag (e.g., v1.0.1).
      </p>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Version</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Size</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
              <th style={{ textAlign: 'center', padding: 12 }}>Rollout</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Date</th>
              <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>v{r.version}</td>
                <td style={{ padding: 12, color: '#666' }}>{(r.size / 1024).toFixed(0)} KB</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: r.isStable ? '#dcfce7' : '#fef3c7', color: r.isStable ? '#166534' : '#92400e',
                  }}>
                    {r.isStable ? 'Stable' : 'Testing'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${r.rolloutPercent}%`, height: '100%', background: r.isStable ? '#22c55e' : '#f59e0b', borderRadius: 4 }}></div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{r.rolloutPercent}%</span>
                  </div>
                </td>
                <td style={{ padding: 12, color: '#666', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {!r.isStable && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {[10, 50, 100].map(pct => (
                        <button key={pct} onClick={() => handleRollout(r.version, pct)}
                          disabled={r.rolloutPercent >= pct}
                          style={{
                            padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer',
                            background: r.rolloutPercent >= pct ? '#f0f0f0' : '#fff', color: r.rolloutPercent >= pct ? '#bbb' : '#333',
                          }}>
                          {pct}%
                        </button>
                      ))}
                      <button onClick={() => handleMarkStable(r.version)}
                        style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: 'none', background: '#166534', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        Stable
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Loading...</td></tr>}
            {!loading && releases.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                No releases yet. Push a tag (e.g., git tag v1.0.0) to trigger a release build.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SHA256 Info */}
      {releases.length > 0 && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Latest Release Checksum</h3>
          <code style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
            SHA256: {releases[0]?.sha256}
          </code>
        </div>
      )}
    </div>
  );
}
