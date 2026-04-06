import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadGroups() {
    setLoading(true);
    const data = await api.getGroups();
    setGroups(data.groups);
    setLoading(false);
  }

  useEffect(() => { loadGroups(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    await api.createGroup(newName.trim());
    setNewName('');
    setCreating(false);
    loadGroups();
  }

  async function handleSync(groupId: string, prayer: number) {
    await api.triggerSync(groupId, prayer);
    alert(`Sync triggered for ${PRAYER_NAMES[prayer]}! All devices in group will play in ~30 seconds.`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Multi-Room Groups</h1>

      {/* Create Group */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', gap: 12 }}>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="New group name (e.g., 'Living Room + Bedroom')"
          style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
        <button onClick={handleCreate} disabled={creating || !newName.trim()}
          style={{ padding: '10px 20px', background: '#1a7a4c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Create Group
        </button>
      </div>

      {/* Groups List */}
      {groups.map(g => (
        <div key={g.id} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</h3>
              <p style={{ fontSize: 12, color: '#888' }}>{g.deviceCount} device{g.deviceCount !== 1 ? 's' : ''} &middot; ID: <code>{g.id.slice(0, 8)}</code></p>
            </div>
            <span style={{
              padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: g.syncEnabled ? '#dcfce7' : '#f3f4f6', color: g.syncEnabled ? '#166534' : '#666',
            }}>
              {g.syncEnabled ? 'Sync On' : 'Sync Off'}
            </span>
          </div>

          {/* Sync Triggers */}
          <div style={{ display: 'flex', gap: 8 }}>
            {PRAYER_NAMES.map((name, idx) => (
              <button key={idx} onClick={() => handleSync(g.id, idx)}
                style={{ flex: 1, padding: '8px 4px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading...</p>}
      {!loading && groups.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#999' }}>
          <p>No groups created yet.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Create a group above, then enter its ID on each MyAthan device.</p>
        </div>
      )}
    </div>
  );
}
