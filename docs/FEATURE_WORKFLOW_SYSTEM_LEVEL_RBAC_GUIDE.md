# Feature Workflow Guide

This document outlines the established pattern for adding new pages, features, and RBAC rules to the application.

## Design System Requirement

**ALL new features MUST use the Stitch Design System:**
- Primary Accent: Electric Lime (#DFFF00)
- Typography: DM Sans
- Spacing: 8px rhythm
- Components: Use from `/src/components/ui/`
- Reference: `/app/components-library` (SuperAdmin only)

See `/docs/design/DESIGN.md` for full design specs or invoke `/stitch` skill for guidance.

## Overview

The application follows a **copy-paste page wrapper pattern** with:
- **Unified data fetching** through `getPageData()`
- **Centralized RBAC configuration** in `rbacConfig.js`
- **Reusable content components** that receive `data`, `userRole`, `userId` props
- **Consistent page wrappers** that differ only by `currentPage` constant

---

## Step 1: Create Data Fetching Function

**Location**: `/src/lib/data/appPageData.ts`

Add a new function to fetch data for your page:

```typescript
export async function getNewFeaturePageData(
  userId: string,
  userRole: string,
  organizationId?: string
) {
  const isSuperAdmin = userRole === "SuperAdmin";
  const data: any = {};

  // Add data to the object
  data.userId = userId;
  data.userRole = userRole;

  if (isSuperAdmin) {
    // SuperAdmin sees all data
    const result = await someRepository.list({ limit: 100 });
    data.items = result.items;
  } else if (organizationId) {
    // Regular users see org-specific data
    const result = await someRepository.findByOrgId(organizationId);
    data.items = result.items;
  }

  return data;
}
```

Then add a case to the `getPageData()` switch statement:

```typescript
export async function getPageData(
  currentPage: string,
  userId: string,
  userRole: string,
  organizationId?: string
): Promise<PageData> {
  // ... existing code ...

  switch (currentPage) {
    case 'appDashboard':
      return getDashboardPageData(isSuperAdmin, organizationId);
    case 'appTeams':
      return getTeamsPageData(isSuperAdmin, organizationId);
    case 'appProjects':
      return getProjectsPageData(isSuperAdmin, organizationId);
    case 'appProjectDetail':
      return getProjectDetailPageData(projectId, userId);
    case 'appNewFeature':  // ADD THIS
      return getNewFeaturePageData(userId, userRole, organizationId);
    default:
      console.warn(`[getPageData] Unknown page: ${currentPage}`);
      return data;
  }
}
```

---

## Step 2: Create Content Component

**Location**: `/src/content-container/[Category]/NewFeature.astro`

Create a component that:
- Imports `Layout` for styling: `import Layout from '../../layouts/Layout.astro';`
- Accepts `data`, `userRole`, `userId` as props
- Destructures what it needs from `data`
- Contains all HTML/structure for the page
- May include client-side `<script>` tags for interactivity
- Uses role checks like `if (isSuperAdmin)` for variations

```astro
---
/**
 * New Feature Content Component
 *
 * Description of what this component does
 */

import Layout from '../../layouts/Layout.astro';

interface Props {
  data: any;
  userRole: string;
  userId: string;
}

const { data, userRole, userId } = Astro.props;

const isSuperAdmin = userRole === "SuperAdmin";
const items = data.items || [];
---

<Layout userRole={userRole} userId={userId}>
  <div class="feature-content">
    <!-- Your content here -->
    <h1>New Feature</h1>
    {items.map(item => (
      <div>{item.name}</div>
    ))}
  </div>
</Layout>

<style>
  /* Component-specific styles */
  /* Note: Layout provides background, padding, max-width */
</style>
```

---

## Step 3: Create Page Wrapper

**Location**: `/src/pages/[route]/new-feature.astro`

Create a thin wrapper page using the **copy-paste template**:

```astro
---
import { getSession } from "../../lib/auth/session-adapter";
import { RBAC_CONFIG } from "../../lib/configs/rbacConfig";
import { getPageData } from "../../lib/data/appPageData";
import RBACComponent from "../../components/RBAC/RBACComponent.astro";
import { getLoginUrl } from "../../lib/auth/feature-flag";

// ============================================================
// ONLY CHANGE THIS LINE FOR NEW PAGES
// ============================================================
const currentPage = 'appNewFeature';

// ============================================================
// STANDARD PAGE LOGIC BELOW (COPY-PASTE)
// ============================================================

// Get session
const session = await getSession(Astro.request, Astro.cookies);

if (!session) {
  return Astro.redirect(getLoginUrl());
}

const user = session.user;
const userId = user?.global_id || user?.id;
const userRole = user?.role;
const organizationId = user?.organizationId;

// Validate role access
if (!userRole || !RBAC_CONFIG[userRole]?.[currentPage]) {
  return Astro.redirect('/access-denied?reason=invalid_role&page=' + currentPage);
}

// Fetch data
const data = await getPageData(currentPage, userId, userRole, organizationId);

// Render RBACComponent
<RBACComponent
  userRole={userRole}
  userId={userId}
  data={data}
  currentPage={currentPage}
/>
```

**Important**: Only the `currentPage` constant changes between pages!

---

## Step 4: Update RBAC Configuration

**Location**: `/src/lib/configs/rbacConfig.js`

1. **Import your new content component** (at the top with other imports):

```javascript
// Content for New Feature
import NewFeature from '../../content-container/[Category]/NewFeature.astro';
```

2. **Add RBAC entries** for each role that should access it:

```javascript
export const RBAC_CONFIG = {

  User: {
    // ... existing entries ...
    appNewFeature: {
      topNav: AppTopNav,      // or TopNav/Blank
      sideNav: Blank,         // or SideNav if you want sidebar
      content: NewFeature,
      footer: Blank,          // or Footer
      title: "New Feature",
      description: "Description of the feature",
    },
  },

  SuperAdmin: {
    // ... existing entries ...
    appNewFeature: {
      topNav: AppTopNav,
      sideNav: Blank,
      content: NewFeature,
      footer: Blank,
      title: "System New Feature",
      description: "SuperAdmin view of new feature",
    },
  },

  // Add for other roles as needed (StudioAdmin, StudioViewer, etc.)
};
```

---

## Step 5: Add Navigation Links (Optional)

**Location**: `/src/layouts/Dashboard/AppTopNav.astro` or SideNav

Add navigation links to make the page accessible:

```astro
<a href="/app/new-feature" class="app-nav-btn app-nav-btn-secondary">
  New Feature
</a>
```

---

## Key Principles

### 1. Copy-Paste Page Wrappers
Page wrappers in `/src/pages/` are identical except for the `currentPage` constant. This makes adding new pages fast and error-free.

### 2. Centralized Data Fetching
All data fetching goes through `getPageData()` in `appPageData.ts`. Pages don't need to know which repositories to use - they just specify `currentPage`.

### 3. Centralized RBAC
All access control and component selection happens in `rbacConfig.js`. To change which components a role sees for a page, update the config.

### 4. Reusable Content Components
Content components receive `data`, `userRole`, `userId` and destructure what they need. They can be shared across multiple roles.

### 5. Role-Based Variations
Use role checks inside content components rather than creating separate components:
```astro
{isSuperAdmin && (
  <div>Admin-only content</div>
)}
```

### 6. Layout Consistency
Content components import `Layout` directly for global styling (background, padding, max-width). This ensures consistent styling across all pages.

---

## Component Reference

### Available Layout Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Layout` | Main layout with global styles | `/src/layouts/Layout.astro` |
| `AppTopNav` | App pages navigation with logout | `/src/layouts/Dashboard/AppTopNav.astro` |
| `TopNav` | Generic top navigation | `/src/layouts/Dashboard/TopNav.astro` |
| `SideNav` | Sidebar navigation | `/src/layouts/Dashboard/SideNav.astro` |
| `AdminSideNav` | Admin sidebar | `/src/layouts/Dashboard/AdminSideNav.astro` |
| `Footer` | Page footer | `/src/layouts/Dashboard/Footer.astro` |
| `Blank` | Empty component (renders nothing) | `/src/content-container/Blank/Content.astro` |

### Available Roles

- `SuperAdmin` - System-wide access, sees all organizations
- `Admin` - Administrative access
- `StudioAdmin` - Studio administrator
- `User` - Regular user with organization-scoped access
- `StudioViewer` - Read-only access

---

## Quick Checklist

When adding a new feature:

- [ ] Create data fetching function in `appPageData.ts`
- [ ] Add case to `getPageData()` switch statement
- [ ] Create content component in `/src/content-container/`
- [ ] Create page wrapper in `/src/pages/` (copy-paste template)
- [ ] Import content component in `rbacConfig.js`
- [ ] Add RBAC entries for each relevant role
- [ ] Add navigation links (if needed)
- [ ] Test with different user roles
- [ ] Verify access control works (try accessing without proper role)

---

## Examples

See these files for complete examples:

- **Data Fetching**: `/src/lib/data/appPageData.ts`
- **Content Component**: `/src/content-container/App/Dashboard.astro`
- **Page Wrapper**: `/src/pages/app/dashboard.astro`
- **RBAC Config**: `/src/lib/configs/rbacConfig.js`

---

*Last Updated: 2025-01-03*
*Status: Active - Current workflow for adding features*
