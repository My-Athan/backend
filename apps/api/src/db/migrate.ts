import { db } from './index.js';
import { sql } from 'drizzle-orm';

/**
 * Creates all tables if they don't exist.
 * Uses raw SQL so we don't need drizzle-kit in the production image.
 */
export async function migrateDatabase() {
  console.log('[Migrate] Checking database schema...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      must_change_password BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS device_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      sync_enabled BOOLEAN NOT NULL DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(32) NOT NULL UNIQUE,
      api_key VARCHAR(128) NOT NULL,
      user_id UUID REFERENCES users(id),
      group_id UUID REFERENCES device_groups(id),
      firmware_version VARCHAR(20),
      last_heartbeat TIMESTAMP,
      last_ip VARCHAR(45),
      lat REAL,
      lon REAL,
      city VARCHAR(100),
      country VARCHAR(100),
      config JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS releases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version VARCHAR(20) NOT NULL UNIQUE,
      sha256 VARCHAR(64) NOT NULL,
      size INTEGER NOT NULL,
      r2_url TEXT NOT NULL,
      release_notes TEXT,
      rollout_percent INTEGER NOT NULL DEFAULT 100,
      is_stable BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(32) NOT NULL,
      date TIMESTAMP NOT NULL,
      prayer_plays JSONB DEFAULT '{}',
      errors INTEGER DEFAULT 0,
      uptime INTEGER DEFAULT 0,
      free_heap INTEGER,
      wifi_rssi INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sync_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES device_groups(id),
      prayer INTEGER NOT NULL,
      trigger_at_epoch INTEGER NOT NULL,
      consumed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS device_commands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(32) NOT NULL,
      command VARCHAR(30) NOT NULL,
      payload JSONB DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      delivered_at TIMESTAMP,
      executed_at TIMESTAMP
    );

    -- Indexes (IF NOT EXISTS supported in PG 9.5+)
    CREATE INDEX IF NOT EXISTS idx_devices_group_id ON devices(group_id);
    CREATE INDEX IF NOT EXISTS idx_devices_last_heartbeat ON devices(last_heartbeat);
    CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
    CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(lat, lon);
    CREATE INDEX IF NOT EXISTS idx_stats_device_date ON stats(device_id, date);
    CREATE INDEX IF NOT EXISTS idx_sync_group_consumed ON sync_triggers(group_id, consumed);
    CREATE INDEX IF NOT EXISTS idx_commands_device_status ON device_commands(device_id, status);
  `);

  // Add must_change_password column if it doesn't exist (for upgrades)
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
  `);

  // Add location columns if they don't exist (for upgrades)
  await db.execute(sql`
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS lat REAL;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS lon REAL;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS country VARCHAR(100);
  `);

  // Add OTA hardware type and auto-update columns (for upgrades)
  await db.execute(sql`
    ALTER TABLE releases ADD COLUMN IF NOT EXISTS hardware_type VARCHAR(30) NOT NULL DEFAULT 'esp32c3-v1';
    ALTER TABLE releases ADD COLUMN IF NOT EXISTS auto_update BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE releases ADD COLUMN IF NOT EXISTS min_version VARCHAR(20);
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS hardware_type VARCHAR(30) DEFAULT 'esp32c3-v1';
  `);

  console.log('[Migrate] Database schema ready.');
}
