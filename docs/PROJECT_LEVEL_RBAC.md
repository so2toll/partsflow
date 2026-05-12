# Project-Level RBAC

**Date**: 2026-05-01
**Status**: ✅ Implemented

---

## Overview

The application now supports **project-level permissions** allowing users to own, edit, and view projects independent of team assignments. This enables personal projects and direct project access sharing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      RBAC Hierarchy                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. System Level (SuperAdmin)                                  │
│     ├─ Can do everything across all organizations              │
│     └─ Role in auth.db: "SuperAdmin"                           │
│                                                                 │
│  2. Organization Level (Admin)                                 │
│     ├─ Can manage all resources within their organization      │
│     └─ Role in auth.db: "Admin"                                │
│                                                                 │
│  3. Team Level (Team Admin)                                    │
│     ├─ Can manage team membership                              │
│     ├─ Can manage projects team works on                       │
│     └─ Relationship: User-MEMBER_OF→Team (role: Admin)         │
│                                                                 │
│  4. Project Level (Project Owner/Editor) ⭐ NEW!               │
│     ├─ Can own personal projects                               │
│     ├─ Can share projects with other users                     │
│     └─ Relationships:                                          │
│        ├─ User-OWNS→Project (full control)                    │
│        ├─ User-CAN_EDIT→Project (edit access)                 │
│        └─ User-CAN_VIEW→Project (view only)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationship Types

### User → Project Relationships

| Relationship | Description | Permissions |
|--------------|-------------|-------------|
| **OWNS** | User created/owns the project | Full control - view, edit, delete, manage permissions |
| **CAN_EDIT** | User has explicit edit access | View, edit, add/remove resources |
| **CAN_VIEW** | User has read-only access | View only |

### Team → Project Relationships

| Relationship | Description | Permissions |
|--------------|-------------|-------------|
| **WORKS_ON** | Team is assigned to project | Team Admins can edit, regular members can view |

---

## Permission Matrix

| Action | SuperAdmin | Org Admin | Team Admin | Project Owner | Project Editor | Project Viewer |
|--------|-----------|-----------|------------|---------------|----------------|----------------|
| View Project | ✅ All | ✅ In Org | ✅ If assigned | ✅ Own projects | ✅ Shared | ✅ Shared |
| Edit Project | ✅ All | ✅ In Org | ✅ If assigned | ✅ Own projects | ✅ Shared | ❌ |
| Delete Project | ✅ All | ✅ In Org | ❌ | ✅ Own projects | ❌ | ❌ |
| Manage Permissions | ✅ All | ✅ In Org | ❌ | ✅ Own projects | ❌ | ❌ |
| Assign Team | ✅ All | ✅ In Org | ❌ | ✅ Own projects | ❌ | ❌ |

---

## How It Works

### Creating a Project

When a user creates a project:

1. User submits project data via API
2. `ProjectRepository.create()` creates the Project node
3. Creator is automatically added as **Project Owner** via `OWNS` relationship
4. Organization linked via `HAS_PROJECT` relationship

```typescript
// In ProjectRepository.create()
if (data.createdBy) {
  await graph.createRelationship(data.createdBy, projectId, "OWNS", {
    grantedAt: now,
  });
}
```

### Checking Permissions

The `ProjectPermissionService` provides permission checking functions:

```typescript
import {
  canViewProject,
  canEditProject,
  canDeleteProject,
  canManageProject,
} from "@/lib/services/ProjectPermissionService";

// Check if user can view a project
const canView = await canViewProject(userId, projectId);

// Check if user can edit
const canEdit = await canEditProject(userId, projectId);

// Check if user can delete (owner only)
const canDelete = await canDeleteProject(userId, projectId);
```

### Middleware

Three middleware wrappers are available for protecting API routes:

```typescript
import {
  requireProjectView,
  requireProjectEdit,
  requireProjectOwner,
} from "@/lib/middleware/requireProjectPermission";

// View access (Owner, Editor, Viewer, or Team member)
export const GET = requireProjectView(async ({ params }) => {
  // ... handler code
});

// Edit access (Owner, Editor, or Team Admin)
export const PUT = requireProjectEdit(async ({ params, request }) => {
  // ... handler code
});

// Owner only (delete, manage permissions)
export const DELETE = requireProjectOwner(async ({ params }) => {
  // ... handler code
});
```

---

## Permission Check Flow

When a user tries to access a project:

```
1. Check session → get global_id from session
   │
2. Is user SuperAdmin? → ✅ Grant all access
   │
3. Is user Organization Admin? → ✅ Grant org-wide access
   │
4. Does user have direct project relationship?
   ├─ OWNS? → ✅ Full access
   ├─ CAN_EDIT? → ✅ Edit access
   ├─ CAN_VIEW? → ✅ View access
   └─ None? → Continue
   │
5. Is user on a team that works on this project?
   ├─ Team Admin? → ✅ Edit access
   └─ Team Member? → ✅ View access
   │
6. ❌ No access → Forbidden
```

---

## Sharing Projects

### Granting Access

Project owners can grant edit or view access to other users:

```typescript
import { grantProjectPermission } from "@/lib/services/ProjectPermissionService";

// Grant edit access
await grantProjectPermission(
  ownerId,           // User granting permission (must be owner)
  targetUserId,      // User receiving permission
  projectId,         // Project ID
  "CAN_EDIT"         // Permission type
);

// Grant view-only access
await grantProjectPermission(
  ownerId,
  targetUserId,
  projectId,
  "CAN_VIEW"
);
```

### Revoking Access

```typescript
import { revokeProjectPermission } from "@/lib/services/ProjectPermissionService";

await revokeProjectPermission(
  ownerId,           // User revoking permission (must be owner)
  targetUserId,      // User losing permission
  projectId          // Project ID
);
```

---

## Database Schema

### Relationships Table

```sql
CREATE TABLE relationships (
  id INTEGER PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT,
  ...
);

-- Examples:
-- User OWNS Project
INSERT INTO relationships (from_node_id, to_node_id, type, properties)
VALUES ('user_01KQG4...', 'proj_01KQE7...', 'OWNS', '{"grantedAt":"2026-05-01T..."}');

-- User CAN_EDIT Project
INSERT INTO relationships (from_node_id, to_node_id, type, properties)
VALUES ('user_01KQG4...', 'proj_01KQE7...', 'CAN_EDIT', '{"grantedAt":"...","grantedBy":"user_..."}');

-- Team WORKS_ON Project
INSERT INTO relationships (from_node_id, to_node_id, type, properties)
VALUES ('team_01KQG...', 'proj_01KQE7...', 'WORKS_ON', '{"assignedAt":"..."}');
```

---

## API Endpoints

### Project Creation

**Endpoint**: `POST /api/projects/create`

**Auto-assigns creator as owner**:
```typescript
const performedBy = session?.user?.global_id || session?.user?.id;

const project = await projectRepository.create({
  name,
  description,
  organizationId: session.user.organizationId,
  createdBy: performedBy,  // ← Auto-added as Project Owner
});
```

### Project Listing by User

**Endpoint**: `GET /api/projects/user`

Returns all projects the user can access:
```typescript
import { getUserAccessibleProjects } from "@/lib/services/ProjectPermissionService";

const projects = await getUserAccessibleProjects(userId);
// Returns: [{ projectId, permission: "owns"|"can_edit"|"can_view" }]
```

---

## Code Examples

### Before (Team-Based Only)

```typescript
// User could only access projects through teams
// ❌ No personal projects
// ❌ No direct project sharing
// ❌ Limited to team-based access
```

### After (Project-Level Permissions)

```typescript
// ✅ User can own personal projects
// ✅ User can share projects directly
// ✅ Multiple access levels (Owner, Editor, Viewer)
// ✅ Team-based access still works

const canEdit = await canEditProject(userId, projectId);
if (canEdit) {
  // Allow editing
}
```

---

## Migration History

| Date | Change |
|------|--------|
| 2026-05-01 | Created `ProjectPermissionService.ts` |
| 2026-05-01 | Created `requireProjectPermission.ts` middleware |
| 2026-05-01 | Updated `ProjectRepository.create()` to auto-add owner |
| 2026-05-01 | Added OWNS relationship to all existing projects |
| 2026-05-01 | Documented project-level RBAC architecture |

---

## Files Created/Modified

### Created
- `src/lib/services/ProjectPermissionService.ts`
- `src/lib/middleware/requireProjectPermission.ts`
- `docs/PROJECT_RBAC.md`

### Modified
- `src/lib/db/repositories/ProjectRepository.ts` - Auto-add creator as owner
- `data/app.db` - Added OWNS relationships to all existing projects

---

## Testing Checklist

- [ ] User can create a project → Automatically becomes owner
- [ ] Project owner can edit their project
- [ ] Project owner can delete their project
- [ ] Project owner can grant CAN_EDIT to another user
- [ ] Project owner can grant CAN_VIEW to another user
- [ ] Project owner can revoke permissions
- [ ] User with CAN_EDIT can edit but not delete
- [ ] User with CAN_VIEW can view but not edit
- [ ] Team Admin can edit projects their team works on
- [ ] Team Member can view projects their team works on
- [ ] Organization Admin can access all projects in org
- [ ] SuperAdmin can access all projects

---

## Notes

- **Project ownership is separate from team assignments** - A user can own a project without being on a team
- **Team access still works** - Teams assigned to projects inherit access based on team role
- **Permission hierarchy is enforced** - Org Admin > Team Admin > Project Owner > Project Editor > Project Viewer
- **Sessions use global_id** - All permission checks use the global_id (app database ULID) not the Better Auth internal ID
