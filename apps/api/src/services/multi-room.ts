import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

// ─────────────────────────────────────────────────────────────
// Multi-Room Sync Coordinator
//
// Computes synchronized trigger epochs for device groups.
// All devices in a group receive the same epoch timestamp
// and play athan at exactly that moment using NTP clocks.
// ─────────────────────────────────────────────────────────────

export async function createSyncTrigger(
  groupId: string,
  prayer: number,
  delaySeconds = 30,
): Promise<{ triggerAtEpoch: number }> {
  const triggerAtEpoch = Math.floor(Date.now() / 1000) + delaySeconds;

  await db.insert(schema.syncTriggers).values({
    groupId,
    prayer,
    triggerAtEpoch,
  });

  return { triggerAtEpoch };
}

export async function getPendingTriggers(groupId: string) {
  const triggers = await db
    .select()
    .from(schema.syncTriggers)
    .where(
      and(
        eq(schema.syncTriggers.groupId, groupId),
        eq(schema.syncTriggers.consumed, false),
      )
    )
    .orderBy(schema.syncTriggers.createdAt);

  return triggers;
}

export async function markTriggerConsumed(triggerId: string) {
  await db
    .update(schema.syncTriggers)
    .set({ consumed: true })
    .where(eq(schema.syncTriggers.id, triggerId));
}

export async function getGroupDevices(groupId: string) {
  return db
    .select({
      deviceId: schema.devices.deviceId,
      lastHeartbeat: schema.devices.lastHeartbeat,
      firmwareVersion: schema.devices.firmwareVersion,
    })
    .from(schema.devices)
    .where(eq(schema.devices.groupId, groupId));
}
