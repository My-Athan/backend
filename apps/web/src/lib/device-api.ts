import type { DeviceStatus, DeviceConfig } from '@myathan/shared';

// ─────────────────────────────────────────────────────────────
// Device API Client — communicates with MyAthan device
// Uses local HTTP (myathan.local) or cloud API fallback
// ─────────────────────────────────────────────────────────────

const LOCAL_BASE = 'http://myathan.local';
const TIMEOUT_MS = 10000;  // 10 second timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export class DeviceAPI {
  private baseUrl: string;

  constructor(baseUrl = LOCAL_BASE) {
    this.baseUrl = baseUrl;
  }

  async getStatus(): Promise<DeviceStatus> {
    const res = await fetchWithTimeout(`${this.baseUrl}/status`);
    return res.json();
  }

  async getTimetable(): Promise<any> {
    const res = await fetchWithTimeout(`${this.baseUrl}/timetable`);
    return res.json();
  }

  async triggerAthan(prayer: number): Promise<void> {
    const params = new URLSearchParams({ prayer: String(Math.max(0, Math.min(4, prayer))) });
    await fetchWithTimeout(`${this.baseUrl}/trigger?${params}`, { method: 'POST' });
  }

  async previewTrack(track: number): Promise<void> {
    const params = new URLSearchParams({ track: String(Math.max(1, Math.min(999, track))) });
    await fetchWithTimeout(`${this.baseUrl}/preview?${params}`, { method: 'POST' });
  }

  async setVolume(level: number): Promise<void> {
    const params = new URLSearchParams({ level: String(Math.max(0, Math.min(30, level))) });
    await fetchWithTimeout(`${this.baseUrl}/volume?${params}`, { method: 'POST' });
  }

  async getConfig(): Promise<DeviceConfig> {
    const res = await fetchWithTimeout(`${this.baseUrl}/config`);
    return res.json();
  }

  async updateConfig(partial: Partial<DeviceConfig>): Promise<void> {
    await fetchWithTimeout(`${this.baseUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
  }
}

export const deviceApi = new DeviceAPI();
