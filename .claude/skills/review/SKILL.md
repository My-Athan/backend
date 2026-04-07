---
name: review
description: Review code changes for the core monorepo. Checks TypeScript, API design, shared types, and security.
allowed-tools: Bash Read Grep Glob
---

# Core Monorepo Code Review

Review current changes against MyAthan backend/frontend standards.

## Review Checklist

### TypeScript
- [ ] No `any` types (use proper types from `@myathan/shared`)
- [ ] All new types exported from `packages/shared/src/index.ts`
- [ ] Types match firmware config.json v2 schema exactly
- [ ] Zod schemas used for API input validation

### API Design
- [ ] RESTful endpoint naming (`/api/device/...`, `/api/admin/...`)
- [ ] Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Device auth via API key, user auth via JWT
- [ ] Rate limiting considered for device endpoints

### Database
- [ ] Drizzle schema matches TypeScript types
- [ ] Indexes on frequently queried columns (deviceId, groupId)
- [ ] JSONB used for flexible config storage
- [ ] Migrations generated for schema changes

### OTA / Release Management
- [ ] Releases require `hardwareType` field matching device hardware
- [ ] `autoUpdate` defaults to `false` (opt-in per release)
- [ ] Semver comparison is numeric (1.10.0 > 1.9.0), not string-based
- [ ] `minVersion` constraint checked when set (skip devices below min)
- [ ] Rollout percent checked with deterministic device hash
- [ ] User `ota.autoUpdateEnabled` preference respected (from device config JSONB)
- [ ] Admin force commands bypass user preference (`force: true` in payload)
- [ ] Upload endpoint validates file size (<=2MB) and computes SHA256
- [ ] R2 path uses `firmware/{hardwareType}/{version}/firmware.bin`
- [ ] Signed download URLs used (time-limited)

### Security
- [ ] No secrets in code (use environment variables)
- [ ] API keys not logged
- [ ] SQL injection impossible (Drizzle ORM parameterizes)
- [ ] CORS configured appropriately

### Shared Types Consistency
- [ ] `DeviceConfig` matches firmware `data/config.json` exactly
- [ ] `PrayerTimes` format matches firmware output
- [ ] Holiday enum matches firmware `IslamicHoliday` enum
- [ ] Any config change is reflected in BOTH repos

## Steps
1. Run `git diff` to see all changes
2. Check if shared types were modified — verify firmware compatibility
3. Apply checklist above
4. Report findings
