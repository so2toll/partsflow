# Global ID Architecture

**Date**: 2026-05-01
**Status**: ✅ Implemented

---

## Overview

The application now uses a **single global_id** that exists in both databases (auth.db and app.db), eliminating the need for ID resolution and linking.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ auth.db (Better Auth)                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ global_id: user_01KQE7CS8J2KBPN5FVDPVK6J5P  ← PRIMARY ID     │ │
│ │ id: TDdcLuiw2hEeZLhgKP8xp0kYF07xRYrV  (internal, auth only)  │ │
│ │ email: steventester1234@gmail.com                           │ │
│ │ role: SuperAdmin                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                    Same global_id value
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ app.db (Graph Database)                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ id: user_01KQE7CS8J2KBPN5FVDPVK6J5P  ← SAME PRIMARY ID     │ │
│ │ email: steventester1234@gmail.com                           │ │
│ │ role: SuperAdmin                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Benefits

1. **Single authoritative ID** - No ID resolution needed
2. **Direct lookups** - No database joins or email fallbacks
3. **Consistent references** - Audit logs, relationships, cache keys all use same ID
4. **Simpler code** - Removed UserResolutionService
5. **Better performance** - No resolution overhead
6. **Less error-prone** - Only one ID to worry about

---

## How It Works

### New User Registration

1. Generate ULID: `user_${ulid()}`
2. Create organization in app.db
3. Create User node in app.db with ULID as `id`
4. Update Better Auth user with `global_id` set to the ULID
5. Both databases now have the same identifier

### Existing Users

1. Query app.db for User node's ULID
2. Update auth.db user's `global_id` with the ULID
3. Both databases now have the same identifier

### Session Usage

```typescript
const session = await getSession(request, cookies);

// Use global_id for all app operations
const userId = session.user.global_id || session.user.id; // Fallback for migration

// Use for:
// - Audit logs
// - Database queries
// - Relationship creation
// - Permission checks
```

---

## Database Schema

### auth.db (Better Auth)

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,              -- Better Auth's internal ID (auth only)
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT,                        -- SuperAdmin, Admin, User, Viewer
  organizationId TEXT,
  global_id TEXT UNIQUE,            -- ← App database ULID (primary identifier)

  -- Other Better Auth fields...
);
```

### app.db (Graph Database)

```cypher
(:User {
  id: "user_01KQE7CS8J2KBPN5FVDPVK6J5P",  // ← SAME as global_id in auth.db
  email: "user@example.com",
  name: "User Name",
  role: "Admin",                       // Organization-level role
  organizationId: "org_abc...",
  createdAt: "2026-05-01T..."
})
```

---

## Code Examples

### Before (Old System)

```typescript
// Had to resolve user by Better Auth ID
let appUser = await resolveUserByBetterAuthId(session.user.id);

if (!appUser) {
  // Fallback to email lookup
  appUser = await resolveUserByEmail(session.user.email);
  if (appUser) {
    await linkBetterAuthUser(session.user.id, session.user.email);
  }
}

const userId = appUser.id; // Finally have the app DB ID
```

### After (New System)

```typescript
// Direct use of global_id
const userId = session.user.global_id || session.user.id;

// That's it! No resolution needed.
```

---

## API Endpoint Migration

All API endpoints updated to use `global_id`:

| File | Change |
|------|--------|
| `src/pages/api/teams/create.ts` | Use `global_id` for `createdBy` |
| `src/pages/api/teams/[id]/members/add.ts` | Use `global_id` for audit logs |
| `src/pages/api/teams/[id]/members/remove.ts` | Use `global_id` for audit logs |
| `src/pages/api/projects/create.ts` | Simplified - removed all resolution logic |
| `src/pages/api/organizations/[id]/members/index.ts` | Use `global_id` for org lookup |
| `src/pages/api/organizations/[id]/members/[userId]/role.ts` | Use `global_id` for operations |
| `src/lib/services/RoleService.ts` | Handle both global_id and Better Auth ID |

---

## Removed Files

The following files were deleted as they're no longer needed:

- `src/lib/services/UserResolutionService.ts` - No longer needed with global_id
- `src/lib/middleware/linkBetterAuthUser.ts` - No longer needed with global_id

---

## Migration History

| Date | Change |
|------|--------|
| 2026-05-01 | Added `global_id` column to auth.db |
| 2026-05-01 | Populated `global_id` for existing users |
| 2026-05-01 | Updated session adapter to include `global_id` |
| 2026-05-01 | Updated Better Auth schema to recognize `global_id` |
| 2026-05-01 | Updated registration flow to set `global_id` |
| 2026-05-01 | Updated all API endpoints to use `global_id` |
| 2026-05-01 | Removed `UserResolutionService` |
| 2026-05-01 | Removed `betterAuthId` field from app.db |

---

## Backward Compatibility

For smooth migration, we added fallback logic:

```typescript
// Use global_id if available, otherwise fall back to id
const userId = session.user.global_id || session.user.id;
```

This ensures the system works during the transition period. Once all users have `global_id` set, we can remove the fallback.

---

## Notes

- **Better Auth's internal `id`** is still used for auth-specific operations
- **`global_id`** is used for all application-level operations
- **Email** is still used as the link for auth.db role sync operations
- **Audit logs** now consistently use global_id
- **Relationships** in graph database use global_id (which is the User node's `id`)
