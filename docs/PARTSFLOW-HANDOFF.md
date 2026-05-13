# PartsFlow — Implementation Handoff

**Status:** Foundation lifted from data3D_v2. Domain modeled. Ready for Phase 0 build.
**Date:** 2026-05-09
**Scope:** Consumer & Shop platform (Baltimore metro launch). Municipal layer deferred.

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Foundation Inherited from data3D_v2](#2-foundation-inherited-from-data3d_v2)
3. [Domain Model](#3-domain-model)
4. [Repurpose vs Retire — Inventory](#4-repurpose-vs-retire--inventory)
5. [Migration Plan — Phased](#5-migration-plan--phased)
6. [First Feature End-to-End: Search and Order](#6-first-feature-end-to-end-search-and-order)
7. [Open Decisions and Deferred Items](#7-open-decisions-and-deferred-items)
8. [Reference Files](#8-reference-files)

---

## 1. What We're Building

PartsFlow is a real-time auto parts sourcing and last-mile delivery platform for independent repair shops in the Baltimore metro area. A repair shop searches 200+ regional suppliers from one screen, places an order at a chosen priority level (P0–P3), and a GPS-dispatched driver delivers the part to the bay in 30–60 minutes.

**The thesis.** Every parts run a tech makes costs the shop $20–30 in loaded labor before they leave the building, plus another ~$90 in idle bay time waiting on the part. Ten runs a day is roughly $27,000/month in invisible cost. PartsFlow recovers that. The Pro plan at $349/mo represents 1.6% of recovered value — a 61:1 ROI to the shop.

**Three revenue layers.**
- **Transaction:** delivery fees on a priority ladder (P3 $16 / P2 $22 / P1 $38 / P0 $55), parts margin (~$9/order), urgency premium. ~$32/order avg, $8.50 contribution margin (27%).
- **Subscription:** Pro $349/mo, Fleet Pro $699/mo. ~90% gross margin.
- **Referral residuals:** ISO-style program, $2–$5 per delivery on referred accounts, indefinitely.

**Defensibility.** No single competitor combines real-time multi-supplier search, urgency-tiered dispatch, last-mile delivery, SLA guarantees, and an ISO-style referral program. Curri is the most credible adjacent competitor — generic logistics, no parts intelligence, no urgency tiers.

**Out of scope for this build (deferred):**
- Municipal fleet command center (Phase 4+)
- EV / used parts / salvage bid aggregation (Phase 4+)
- Multi-market expansion (Phase 4+)

The MVP is the Baltimore consumer & shop platform. Everything in this document targets that.

---

## 2. Foundation Inherited from data3D_v2

This project is being built on top of the architectural foundation developed in the data3D_v2 codebase (originally a Video AI Content Studio). The previous domain is being retired. The infrastructure is being kept.

### What's reusable as-is

- **Stack:** Astro for pages and API routes, React/TSX for interactive widgets, SQLite (Better Auth + app graph DB), Tailwind + Stitch design system.
- **Two-database pattern:** `auth.db` (Better Auth, authentication only) and `app.db` (graph database with `nodes` and `relationships` tables). Bridged by `global_id` (ULID) which lives in both DBs.
- **Graph abstraction layer** (`/src/lib/db/graph.ts`): Cypher-like queries that compile to SQL. Lets us think in graphs while storing relationally.
- **Three-tier RBAC:** System (SuperAdmin) → Organization → Team. Permission relationships stored in the graph.
- **Copy-paste page workflow:** Adding a new page changes one line (`const currentPage = 'appXyz'`). Data fetching is centralized in `getPageData()`. RBAC config is centralized in `rbacConfig.js`. Content components in `/src/content-container/[Category]/` are dumb components receiving `{data, userRole, userId}` props.
- **Repository pattern:** All DB access through `/src/lib/db/repositories/[Name]Repository.ts`.
- **Middleware pattern:** `requireTeamPermission`, `requireProjectPermission` style wrappers for API route protection.
- **Audit logging:** AuditService writes to `app.db` audit log.
- **Self-protection rules:** Can't demote yourself, can't remove last admin, can't remove team creator.
- **Tooling:**
  - `/add-feature` skill — scaffolds new pages
  - `/stitch` skill — design system enforcement
  - `coder` agent — writes production-quality code following the patterns
  - `.claude/tasks/[date]/tasks[N]/` for task tracking
  - `.claude/summaries/` for session-end documentation
- **Design system:** MotoFlow Design System (Orange #ff5c00 primary accent, DM Sans, 8px spacing rhythm, borderless cards with shadows, dark sidebar #1A202C). See `/src/styles/global.css` for CSS variables. Extend from `StitchSideNav.astro` and `StitchTopNav.astro`.

### What's getting retired

All video-AI domain code: CharacterRepository, SceneRepository, AssetRepository, ClipRepository, StudioVideoRepository, the Director Agent, the GPU worker, the Remotion integration, the DeepLake client, all video-specific content components.

### What was planned but not yet built (we'll build for PartsFlow)

- BullMQ + Redis queue infrastructure
- Azure Blob Storage client
- Stripe billing integration

These were specified for the video project but never wired up. We'll build them now, scoped to PartsFlow needs.

### What's brand-new for PartsFlow (not in foundation)

- Geospatial query layer (SQLite R-tree initially, PostGIS later)
- Real-time pub/sub for live order tracking
- SMS service (Twilio)
- Mapping/routing service (Mapbox or Google Maps)
- Supplier inventory sync workers

---

## 3. Domain Model

### 3.1 Roles

| Role | Tier | Where stored | Notes |
|---|---|---|---|
| SuperAdmin | System | `auth.db` user.role | PartsFlow ops. shopId is null. Sees everything. |
| Owner | Shop | `User -[BELONGS_TO {role: Owner}]-> Shop` | Full shop control, billing, can delete shop. Auto-assigned at shop creation. |
| Manager | Shop | `User -[BELONGS_TO {role: Manager}]-> Shop` | Places orders, manages staff, sees billing. |
| Tech | Shop | `User -[BELONGS_TO {role: Tech}]-> Shop` | Places and tracks orders. |
| Viewer | Shop | `User -[BELONGS_TO {role: Viewer}]-> Shop` | Read-only. |
| Driver | System (operational) | `User.role = Driver`, separate `Driver` node | Authenticates via PartsFlow, not in any shop. Linked to a `Driver` node holding operational state. |

**Auth.db role enum:** `SuperAdmin | User | Driver`. The `User` value covers everyone who's in a shop; their shop-level role is stored in the BELONGS_TO relationship in app.db.

### 3.2 Node types

#### System layer (kept from foundation)

```cypher
(:User {id, email, name, role, shopId?, createdAt, updatedAt})
(:AuditLog {id, action, actorId, targetId, targetType, metadata, createdAt})
(:Job {id, jobType, status, priority, payload, result, errorMessage, workerId, startedAt, completedAt, createdAt})
```

`Job` is repurposed: same shape as the foundation, but jobType values change to `dispatch`, `sms`, `supplier_sync`, `payment_capture`, etc.

#### Tenant layer

```cypher
(:Shop {id, name, address, phone, email, billingEmail, subscriptionPlan, subscriptionStatus, createdAt, updatedAt})
(:Team {id, name, shopId, createdBy, createdAt, updatedAt})
```

Shop replaces Organization. Same structural role (the tenant), new name.

#### Domain layer (new)

```cypher
(:Supplier {id, name, displayName, address, phone, integrationType, integrationStatus, isActive, createdAt, updatedAt})
(:SupplierInventory {id, supplierId, partNumber, partName, brand, price, quantity, lastSyncedAt})
(:Part {id, canonicalPartNumber, name, category, vehicleApplications, createdAt})
(:Order {id, shopId, createdBy, priority, status, deliveryAddress, totalCents, deliveryFeeCents, partsMarginCents, urgencyFeeCents, slaTargetAt, deliveredAt, createdAt, updatedAt})
(:OrderLineItem {id, orderId, supplierId, partNumber, partName, quantity, unitPriceCents, lineTotalCents})
(:Quote {id, searchQuery, vin?, results, selectedSupplierId, selectedPartNumber, snapshotAt})
(:Driver {id, userId, licenseNumber, vehicleId, status, currentLat, currentLng, currentZoneId, hourlyRate, createdAt})
(:Vehicle {id, make, model, year, licensePlate, type})
(:Location {id, label, lat, lng, address, city, state, zip})
(:DeliveryZone {id, name, polygonGeoJSON, baseFee, surgeMultiplier})
(:Subscription {id, shopId, plan, stripeSubscriptionId, status, currentPeriodEnd, createdAt})
(:PaymentEvent {id, shopId?, userId?, stripeEventId, eventType, amountCents, currency, metadata, createdAt})
```

**Notes on the domain nodes:**

- `Part` is a canonical catalog (optional for MVP). For launch we can denormalize part identity onto OrderLineItem and SupplierInventory. Add Part later when we need cross-supplier part deduplication and analytics.
- `SupplierInventory` is the bridge between Supplier and Part. For MVP, it can be a flat denormalized record (partNumber + partName as strings). When we add canonical Parts, it links to a Part node.
- `Quote` captures the search-result snapshot at order time. This is dispute-resolution gold and audit material. Cheap to add now, painful to retrofit.
- `Driver` is separate from User. The User holds auth identity (`role = Driver`). The Driver node holds operational state (current lat/lng, status, vehicle, zone). One-to-one linked.
- `DeliveryZone` for MVP can be simple bounding boxes or zip-code groups. Polygon GeoJSON for future when we use Mapbox.
- `Location` is a generic geographic point — used for shop addresses, supplier addresses, delivery destinations. Avoids duplicating lat/lng across many node types.

### 3.3 Relationships

#### Identity & tenancy

```cypher
(User)-[:BELONGS_TO {role: Owner|Manager|Tech|Viewer}]->(Shop)
(User)-[:OWNS]->(Shop)                          // creator/primary owner
(User)-[:MEMBER_OF {role: Admin|User|Viewer}]->(Team)
(Shop)-[:HAS_TEAM]->(Team)
```

#### Shop locations

```cypher
(Shop)-[:LOCATED_AT]->(Location)
(Shop)-[:DELIVERS_TO]->(Location)              // shops can have multiple delivery destinations
```

#### Supplier network

```cypher
(Supplier)-[:LOCATED_AT]->(Location)
(Supplier)-[:HAS_INVENTORY]->(SupplierInventory)
(SupplierInventory)-[:FOR_PART]->(Part)        // optional, when canonical Part exists
(Supplier)-[:SERVES]->(DeliveryZone)
```

#### Driver operations

```cypher
(User)-[:IS]->(Driver)                          // auth identity to operational profile
(Driver)-[:OPERATES]->(Vehicle)
(Driver)-[:ACTIVE_IN]->(DeliveryZone)
(Driver)-[:CURRENTLY_AT]->(Location)            // updated frequently; consider caching
```

#### The order flow (the core loop)

```cypher
(Shop)-[:PLACED]->(Order)
(User)-[:CREATED]->(Order)                      // the tech/manager who clicked submit
(Order)-[:HAS_LINE_ITEM]->(OrderLineItem)
(OrderLineItem)-[:FROM_SUPPLIER]->(Supplier)
(OrderLineItem)-[:FOR_PART]->(Part)             // optional, when canonical Part exists
(Order)-[:QUOTED_FROM]->(Quote)
(Order)-[:ASSIGNED_TO]->(Driver)
(Order)-[:DELIVER_TO]->(Location)
(Order)-[:HAS_JOB]->(Job)                       // dispatch job, SMS jobs, etc.
```

#### Billing

```cypher
(Shop)-[:SUBSCRIBES_TO]->(Subscription)
(Shop)-[:MADE_PAYMENT]->(PaymentEvent)
(Order)-[:CHARGED_AS]->(PaymentEvent)
```

### 3.4 Order priority and status

**Priority (set at order creation):**
- `P3` — Scheduled. Customer-chosen window. $16 base.
- `P2` — Standard. 45–60 min SLA. $22 base. (Default)
- `P1` — Urgent. 30–45 min SLA. $38 base. Car on lift.
- `P0` — Emergency. ≤30 min SLA. $55 base. Drop-everything.

**Status (lifecycle):**
- `pending` — created, not yet dispatched
- `dispatched` — assigned to driver, awaiting pickup
- `picked_up` — driver has the part
- `en_route` — driver is delivering
- `delivered` — completed, awaiting confirmation
- `confirmed` — shop confirmed receipt
- `cancelled` — cancelled before delivery
- `failed` — couldn't be delivered (out of stock at pickup, supplier issue, etc.)

### 3.5 RBAC for orders

For MVP, orders are scoped to the shop that placed them. Anyone with `BELONGS_TO -> Shop` can view orders. `Tech` and above can create. `Manager` and above can cancel. The granular `OWNS / CAN_EDIT / CAN_VIEW` pattern from the foundation is available but not used for orders — too granular for the use case.

Drivers see only orders where `Order -[:ASSIGNED_TO]-> Driver` matches their driver node.

SuperAdmin sees everything.

---

## 4. Repurpose vs Retire — Inventory

### 4.1 Lift cleanly (zero changes beyond rename)

| File / Pattern | Notes |
|---|---|
| `/src/lib/auth/auth.ts` | Better Auth config. Update role enum: `SuperAdmin \| User \| Driver`. |
| `/src/lib/auth/session-adapter.ts` | Session handling. No changes. |
| `/src/lib/auth/init-auth-db.ts` | Initialization script. No changes. |
| `/src/lib/db/graph.ts` | Graph abstraction. No changes. |
| `/src/lib/db/repositories/UserRepository.ts` | No changes. |
| `/src/lib/db/repositories/TeamRepository.ts` | No changes. (Teams within a shop still useful.) |
| `/src/lib/db/repositories/AuditRepository.ts` | No changes. |
| `/src/lib/services/AuditService.ts` | No changes. |
| `/src/lib/services/TeamPermissionService.ts` | No changes. |
| `/src/lib/middleware/requireTeamPermission.ts` | No changes. |
| `/src/components/RBAC/RBACComponent.astro` | No changes. |
| `/src/layouts/Layout.astro` | No changes. |
| `/src/components/ui/*` | All Stitch UI components. No changes. |
| `/src/styles/global.css` | Stitch tokens. No changes. |
| `/src/pages/dev/graph-explorer.astro` | Dev tool. No changes. |
| `.claude/skills/add-feature.md` | No changes. |
| `.claude/skills/stitch.md` | No changes. |
| `.claude/agents/coder.md` | No changes. |

### 4.2 Repurpose with rename

| Current | Becomes | Notes |
|---|---|---|
| `Organization` (everywhere) | `Shop` | Type, queries, references. Keep `organizationId` field name on User for now to avoid breaking auth.db migration; add `shopId` as alias. Or rename and migrate — see Phase 0. |
| `OrganizationRepository` | `ShopRepository` | Same shape. |
| `ProjectRepository` | (delete; pattern lives on in `OrderRepository`) | Different domain. |
| `/src/content-container/App/Dashboard.astro` | Rebuild for PartsFlow data | Show recent orders, active drivers, stats. |
| `/src/content-container/App/Projects.astro` | Delete; replaced by `/Orders/List.astro` | Different domain. |
| `AppTopNav.astro` | Update nav links | Dashboard, Search Parts, Orders, Suppliers, Profile. |
| `PaymentRepository` | `PaymentRepository` (kept), add `SubscriptionRepository` | Existing payment shape works for Stripe events. Add subscription shape on top. |
| `rbacConfig.js` | Update `RBAC_CONFIG` keys | New page keys: `appPartsSearch`, `appOrders`, `appOrderDetail`, `appSuppliers`, `appDrivers` (SuperAdmin), `appBilling`. |

### 4.3 Retire entirely

Delete these files:

```
/src/lib/db/repositories/CharacterRepository.ts
/src/lib/db/repositories/SceneRepository.ts
/src/lib/db/repositories/AssetRepository.ts
/src/lib/db/repositories/ClipRepository.ts
/src/lib/db/repositories/StudioVideoRepository.ts
/src/lib/db/repositories/JobRepository.ts        // delete and recreate with PartsFlow jobTypes
/src/content-container/Studio/                   // entire directory if it exists
/director/                                       // Python Director Agent
/gpu-worker/                                     // GPU inference
/remotion/                                       // video assembly
```

Any task files in `.claude/tasks/2026_05_02/` are historical reference only — archive, don't delete (they document the foundation we built).

### 4.4 New build

#### Repositories

```
/src/lib/db/repositories/ShopRepository.ts          // renamed from OrganizationRepository
/src/lib/db/repositories/SupplierRepository.ts
/src/lib/db/repositories/SupplierInventoryRepository.ts
/src/lib/db/repositories/PartRepository.ts          // optional for MVP
/src/lib/db/repositories/OrderRepository.ts
/src/lib/db/repositories/OrderLineItemRepository.ts
/src/lib/db/repositories/QuoteRepository.ts
/src/lib/db/repositories/DriverRepository.ts
/src/lib/db/repositories/VehicleRepository.ts
/src/lib/db/repositories/LocationRepository.ts
/src/lib/db/repositories/DeliveryZoneRepository.ts
/src/lib/db/repositories/SubscriptionRepository.ts
/src/lib/db/repositories/JobRepository.ts            // recreated for PartsFlow job types
```

#### Services

```
/src/lib/services/PartSearchService.ts             // ranks supplier results by speed/price
/src/lib/services/OrderPricingService.ts           // computes priority fee, parts margin, total
/src/lib/services/DispatchService.ts               // assigns drivers to orders
/src/lib/services/GeoService.ts                    // distance, ETA, zone lookup
/src/lib/services/SmsService.ts                    // Twilio wrapper
/src/lib/services/StripeService.ts                 // checkout, webhooks, subscriptions
/src/lib/services/SupplierSyncService.ts           // polls/receives supplier inventory updates
/src/lib/services/RealtimeService.ts               // Pusher/Ably/Supabase Realtime wrapper
```

#### Infrastructure

```
/src/lib/queue.ts                                  // BullMQ setup
/src/lib/storage.ts                                // Azure Blob client
/src/lib/stripe.ts                                 // Stripe client
/src/lib/sms.ts                                    // Twilio client
/src/lib/maps.ts                                   // Mapbox/Google Maps client
/src/lib/realtime.ts                               // Pub/sub client
/workers/dispatch-worker.ts
/workers/sms-worker.ts
/workers/supplier-sync-worker.ts
/workers/payment-worker.ts
```

---

## 5. Migration Plan — Phased

### Phase 0 — Rename and Retire (≈ 1–2 days)

**Goal:** Clean slate that compiles. No new features yet.

1. Branch off the current data3D_v2 codebase. Create `partsflow` branch (or new repo, depending on preference).
2. Delete retired files (Section 4.3).
3. Rename Organization → Shop:
   - `OrganizationRepository.ts` → `ShopRepository.ts`
   - All references throughout the codebase
   - DB migration: rename node label `Organization` → `Shop` in app.db
   - Decision point: rename `User.organizationId` → `User.shopId`? Recommend YES — do it once, get it over with. Migration script: `UPDATE user SET shopId = organizationId; DROP COLUMN organizationId;` (SQLite needs table recreation for column drop — write the migration carefully).
4. Update `auth.db` role enum: `SuperAdmin | User | Driver`. Migration: existing users with `Admin` role become `User` (since shop-level role lives in app.db now).
5. Update `rbacConfig.js`: remove video-specific page keys, no PartsFlow keys yet.
6. Update `AppTopNav.astro`: minimal nav (Dashboard, Profile) — just enough to compile.
7. Strip Dashboard content component to a placeholder.
8. Run `npm run build`. Fix everything that breaks. Commit clean state.

**Acceptance:** Project builds. Login works. SuperAdmin and User can both access dashboard (placeholder). No video-AI references remain.

### Phase 1 — Domain Model + Infrastructure (≈ 3–5 days)

**Goal:** All node types and repositories exist. Infrastructure is wired. No user-facing features yet.

1. Create new node types in graph schema. No DB migration needed — graph is schemaless on the property side; just start using the new labels.
2. Create new repositories (Section 4.4). Each follows the pattern of TeamRepository: ULID generation, graph create/update/delete, mapNodeTo helpers.
3. Stand up infrastructure:
   - `docker-compose.yml` with Redis for BullMQ
   - Azure Blob Storage account + containers
   - Stripe test account + products (Pro, Fleet Pro)
   - Twilio test account
   - Mapbox or Google Maps API key
4. Build infrastructure clients: `queue.ts`, `storage.ts`, `stripe.ts`, `sms.ts`, `maps.ts`, `realtime.ts`.
5. Update RBAC roles in `rbacConfig.js` to support Owner / Manager / Tech / Viewer / Driver.
6. Seed test data:
   - 2 shops (Acme Auto, Eastside Repair)
   - 1 user per shop role across the two shops
   - 5 suppliers in Baltimore metro with realistic addresses
   - 100+ supplier inventory items across the suppliers (brake rotors, oil filters, batteries, etc.)
   - 3 drivers
   - 5 delivery zones (zip-code-group based for MVP)

**Acceptance:** All repositories pass unit tests. Graph explorer (`/dev/graph-explorer`) shows the seeded data correctly. Infrastructure clients connect to their services.

### Phase 2 — First Feature: Search and Order (≈ 5–7 days)

**Goal:** A tech logged into a shop can search for a part, see ranked supplier results, place an order, and view the order detail page.

This is detailed in Section 6.

**Acceptance:** Full happy path works end-to-end with stubbed dispatch (no real driver assignment yet). Order is persisted with all relationships. Quote is recorded. Audit log is written.

### Phase 3 — Driver Side and Real Dispatch (≈ 7–10 days)

**Goal:** Driver app (web for MVP), real dispatch logic, real-time order tracking.

1. Driver login flow + driver dashboard
2. Dispatch worker — assigns drivers to orders based on proximity and availability
3. Driver order acceptance flow
4. Driver status updates (picked up, en route, delivered)
5. Real-time order tracking on the shop side via pub/sub
6. SMS notifications at each status change
7. Proof-of-delivery photo upload (Azure Blob)

### Phase 4 — Billing and Pricing (≈ 5–7 days)

**Goal:** Subscription billing, per-order charging, priority pricing.

1. Stripe Checkout for Pro / Fleet Pro subscriptions
2. Stripe webhook handler for subscription lifecycle
3. Per-order pricing via `OrderPricingService`
4. Capture payment on order completion
5. Customer portal endpoint for billing management
6. Pricing page

### Phase 5 — Supplier Inventory Sync and Operations (≈ 7–14 days)

**Goal:** Real supplier integrations beyond seeded data.

1. Supplier sync worker
2. Per-supplier integration adapters (start with whichever 2–3 are easiest — likely API-based ones)
3. Manual inventory CSV import for suppliers without APIs
4. Supplier admin UI (likely SuperAdmin-only initially)
5. Supplier rep accounts (deferred from MVP — add User role: SupplierRep)

### Phase 6 — Polish and Launch (≈ 5–7 days)

1. Landing page
2. Onboarding flow for shops
3. Error handling pass
4. Mobile responsive pass
5. Rate limiting
6. Email notifications (Resend or similar)
7. Production deploy
8. Custom domain + SSL

---

## 6. First Feature End-to-End: Search and Order

This walks through every layer of the foundation, in order. When this slice ships, the patterns are proven.

**User story:** A tech at Acme Auto needs a brake rotor for a 2018 Honda Civic. They navigate to Search Parts, enter the part. They see 4 supplier results ranked by ETA. They click "Order Fastest" on the top result. Confirm priority (P2 default). Submit. They're redirected to the order detail page showing pending status.

### 6.1 RBAC config

**File:** `/src/lib/configs/rbacConfig.js`

Add page keys for each role that should access:

```javascript
import PartsSearch from '../../content-container/Parts/Search.astro';
import OrdersList from '../../content-container/Orders/List.astro';
import OrderDetail from '../../content-container/Orders/Detail.astro';

export const RBAC_CONFIG = {
  Owner: {
    appPartsSearch: { topNav: AppTopNav, sideNav: Blank, content: PartsSearch, footer: Blank, title: "Search Parts", description: "Find and order parts" },
    appOrders:      { topNav: AppTopNav, sideNav: Blank, content: OrdersList, footer: Blank, title: "Orders", description: "Active and historical orders" },
    appOrderDetail: { topNav: AppTopNav, sideNav: Blank, content: OrderDetail, footer: Blank, title: "Order", description: "Order detail and tracking" },
    // ... other pages
  },
  Manager: { /* same access as Owner for these pages */ },
  Tech:    { /* same */ },
  Viewer:  {
    appOrders:      { /* read-only */ },
    appOrderDetail: { /* read-only */ },
    // No appPartsSearch — viewers can't place orders
  },
  SuperAdmin: { /* sees all */ },
  Driver:  { /* different page set entirely — see Phase 3 */ },
};
```

### 6.2 Data fetching

**File:** `/src/lib/data/appPageData.ts`

Add three new functions and switch cases:

```typescript
export async function getPartsSearchPageData(userId, userRole, shopId) {
  const data: any = { userId, userRole };
  if (shopId) {
    data.recentSearches = await quoteRepository.findRecentByShopId(shopId, 10);
    data.frequentParts = await orderRepository.findFrequentPartsByShopId(shopId, 10);
  }
  return data;
}

export async function getOrdersListPageData(userId, userRole, shopId) {
  const data: any = { userId, userRole };
  if (userRole === 'SuperAdmin') {
    data.orders = await orderRepository.list({ limit: 100 });
  } else if (shopId) {
    data.orders = await orderRepository.findByShopId(shopId, { limit: 50 });
  }
  return data;
}

export async function getOrderDetailPageData(orderId, userId, userRole, shopId) {
  const data: any = { userId, userRole };
  const order = await orderRepository.findByIdWithRelations(orderId);
  // Permission check: SuperAdmin always; otherwise must be same shop
  if (userRole !== 'SuperAdmin' && order?.shopId !== shopId) {
    return { ...data, forbidden: true };
  }
  data.order = order;
  data.lineItems = await orderLineItemRepository.findByOrderId(orderId);
  data.quote = order?.quoteId ? await quoteRepository.findById(order.quoteId) : null;
  data.driver = order?.driverId ? await driverRepository.findById(order.driverId) : null;
  return data;
}

// In getPageData switch:
case 'appPartsSearch': return getPartsSearchPageData(userId, userRole, shopId);
case 'appOrders':      return getOrdersListPageData(userId, userRole, shopId);
case 'appOrderDetail': return getOrderDetailPageData(params.id, userId, userRole, shopId);
```

### 6.3 Content components

**File:** `/src/content-container/Parts/Search.astro`

```astro
---
import Layout from '../../layouts/Layout.astro';
import PartSearchForm from '../../components/widgets/PartSearchForm';
import RecentSearchList from '../../components/widgets/RecentSearchList';

const { data, userRole, userId } = Astro.props;
---
<Layout title="Search Parts">
  <div class="page-content">
    <div class="page-header">
      <h1>Search Parts</h1>
      <p class="page-description">Find parts across 200+ Baltimore suppliers. Live inventory, real prices.</p>
    </div>
    <PartSearchForm client:load />
    {data.recentSearches?.length > 0 && (
      <section class="section">
        <h2 class="section-title">Recent Searches</h2>
        <RecentSearchList client:load searches={data.recentSearches} />
      </section>
    )}
  </div>
</Layout>
```

`PartSearchForm.tsx` is a React component that:
1. Renders a search input with VIN/part-number toggle
2. Calls `POST /api/parts/search` on submit
3. Renders a `<SupplierResultsList>` with ranked results
4. Each result has an "Order Fastest" / "Order This" button that opens `<OrderConfirmModal>`

`OrderConfirmModal.tsx`:
1. Confirms supplier, part, price
2. Lets the user pick priority (P2 default; P1/P0 visible with reasoning text)
3. Confirms delivery address (defaults to shop address; can pick alternate Location)
4. On submit, calls `POST /api/orders/create` and redirects to `/app/orders/[id]`

### 6.4 Page wrappers

**File:** `/src/pages/app/parts/search.astro`

```astro
---
import { getSession } from "../../../lib/auth/session-adapter";
import { RBAC_CONFIG } from "../../../lib/configs/rbacConfig";
import { getPageData } from "../../../lib/data/appPageData";
import RBACComponent from "../../../components/RBAC/RBACComponent.astro";
import { getLoginUrl } from "../../../lib/auth/feature-flag";

const currentPage = 'appPartsSearch';

const session = await getSession(Astro.request, Astro.cookies);
if (!session) return Astro.redirect(getLoginUrl());

const user = session.user;
const userId = user?.global_id || user?.id;
const userRole = user?.role;
const shopId = user?.shopId;

if (!userRole || !RBAC_CONFIG[userRole]?.[currentPage]) {
  return Astro.redirect('/access-denied?reason=invalid_role&page=' + currentPage);
}

const data = await getPageData(currentPage, userId, userRole, shopId);
---

<RBACComponent userRole={userRole} userId={userId} data={data} currentPage={currentPage} />
```

**File:** `/src/pages/app/orders/[id].astro` — same template, `currentPage = 'appOrderDetail'`, passes `params.id` through.

**File:** `/src/pages/app/orders/index.astro` — same template, `currentPage = 'appOrders'`.

This is the copy-paste pattern in action. Three new pages, the only line that changes is the currentPage constant.

### 6.5 API endpoints

**File:** `/src/pages/api/parts/search.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { partSearchService } from '../../../lib/services/PartSearchService';
import { quoteRepository } from '../../../lib/db/repositories/QuoteRepository';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(request, cookies);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { query, vin, sortBy = 'speed' } = body;
  const shopId = session.user.shopId;

  // PartSearchService queries SupplierInventory across suppliers
  // serving this shop's delivery zone, ranks by ETA or price.
  const results = await partSearchService.search({ query, vin, shopId, sortBy });

  // Persist a Quote node so we have an audit trail of what was offered.
  const quote = await quoteRepository.create({
    shopId,
    userId: session.user.global_id,
    searchQuery: query,
    vin,
    results: results.map(r => ({ supplierId: r.supplierId, partNumber: r.partNumber, price: r.price, eta: r.etaMinutes })),
  });

  return new Response(JSON.stringify({ quoteId: quote.id, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**File:** `/src/pages/api/orders/create.ts`

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { orderRepository } from '../../../lib/db/repositories/OrderRepository';
import { orderLineItemRepository } from '../../../lib/db/repositories/OrderLineItemRepository';
import { orderPricingService } from '../../../lib/services/OrderPricingService';
import { dispatchService } from '../../../lib/services/DispatchService';
import { auditService } from '../../../lib/services/AuditService';
import { requireShopRole } from '../../../lib/middleware/requireShopRole';

const handler: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(request, cookies);
  const body = await request.json();
  const { quoteId, supplierId, partNumber, quantity, priority, deliveryLocationId } = body;

  const userId = session.user.global_id;
  const shopId = session.user.shopId;

  // Compute pricing based on priority + parts cost
  const pricing = await orderPricingService.computeOrderPricing({
    supplierId, partNumber, quantity, priority,
  });

  // Create the Order node + relationships
  const order = await orderRepository.create({
    shopId,
    createdBy: userId,
    priority,
    status: 'pending',
    deliveryLocationId,
    quoteId,
    deliveryFeeCents: pricing.deliveryFeeCents,
    partsMarginCents: pricing.partsMarginCents,
    urgencyFeeCents: pricing.urgencyFeeCents,
    totalCents: pricing.totalCents,
    slaTargetAt: pricing.slaTargetAt,
  });

  // Create line item
  await orderLineItemRepository.create({
    orderId: order.id,
    supplierId,
    partNumber,
    partName: pricing.partName,
    quantity,
    unitPriceCents: pricing.unitPriceCents,
    lineTotalCents: pricing.lineTotalCents,
  });

  // Queue dispatch (stubbed in Phase 2 — real driver assignment in Phase 3)
  await dispatchService.queueDispatch(order.id);

  // Audit log
  await auditService.log({
    actorId: userId,
    action: 'order.created',
    targetId: order.id,
    targetType: 'Order',
    metadata: { priority, supplierId, totalCents: pricing.totalCents },
  });

  return new Response(JSON.stringify({ orderId: order.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// Owner, Manager, Tech can create orders. Viewer cannot.
export const POST = requireShopRole(['Owner', 'Manager', 'Tech'])(handler);
```

### 6.6 Repositories needed for this slice

**Critical path:**
- `SupplierRepository` — at least `findByDeliveryZoneId`, `findById`
- `SupplierInventoryRepository` — `findByPartNumber` (across suppliers), `findBySupplierId`
- `QuoteRepository` — `create`, `findById`, `findRecentByShopId`
- `OrderRepository` — `create`, `findById`, `findByIdWithRelations`, `findByShopId`
- `OrderLineItemRepository` — `create`, `findByOrderId`
- `LocationRepository` — `findByShopId` (for delivery address picker)

Each follows the established pattern from `TeamRepository.ts`: ULID generation, graph node creation, relationship creation, `mapNodeToX` helper.

### 6.7 Services needed for this slice

- `PartSearchService.search(...)` — queries SupplierInventory, ranks by ETA/price, returns ordered list
- `OrderPricingService.computeOrderPricing(...)` — applies the priority ladder + parts margin
- `DispatchService.queueDispatch(orderId)` — Phase 2: just enqueues a Job, no assignment yet
- `GeoService.estimateETA(supplierLocationId, deliveryLocationId)` — for Phase 2: use straight-line distance × constant; replace with Mapbox in Phase 3

### 6.8 Middleware

**File:** `/src/lib/middleware/requireShopRole.ts`

Mirrors `requireTeamPermission` pattern. Checks the BELONGS_TO relationship's role property.

```typescript
export function requireShopRole(allowedRoles: ShopRole[]) {
  return (handler: APIRoute): APIRoute => {
    return async (context) => {
      const session = await getSession(context.request, context.cookies);
      if (!session) return new Response('Unauthorized', { status: 401 });
      if (session.user.role === 'SuperAdmin') return handler(context);

      const userId = session.user.global_id;
      const shopId = session.user.shopId;
      const userShopRole = await getShopRole(userId, shopId);

      if (!allowedRoles.includes(userShopRole)) {
        return new Response('Forbidden', { status: 403 });
      }
      return handler(context);
    };
  };
}
```

### 6.9 Files created in this slice — full inventory

```
/src/lib/data/appPageData.ts                                  (modified)
/src/lib/configs/rbacConfig.js                                (modified)
/src/lib/db/repositories/ShopRepository.ts                    (renamed in P0)
/src/lib/db/repositories/SupplierRepository.ts                (new)
/src/lib/db/repositories/SupplierInventoryRepository.ts       (new)
/src/lib/db/repositories/OrderRepository.ts                   (new)
/src/lib/db/repositories/OrderLineItemRepository.ts           (new)
/src/lib/db/repositories/QuoteRepository.ts                   (new)
/src/lib/db/repositories/LocationRepository.ts                (new)
/src/lib/services/PartSearchService.ts                        (new)
/src/lib/services/OrderPricingService.ts                      (new)
/src/lib/services/DispatchService.ts                          (new — stub)
/src/lib/services/GeoService.ts                               (new — stub)
/src/lib/middleware/requireShopRole.ts                        (new)
/src/components/widgets/PartSearchForm.tsx                    (new)
/src/components/widgets/SupplierResultsList.tsx               (new)
/src/components/widgets/SupplierResultCard.tsx                (new)
/src/components/widgets/OrderConfirmModal.tsx                 (new)
/src/components/widgets/RecentSearchList.tsx                  (new)
/src/components/widgets/OrderStatusTracker.tsx                (new)
/src/content-container/Parts/Search.astro                     (new)
/src/content-container/Orders/List.astro                      (new)
/src/content-container/Orders/Detail.astro                    (new)
/src/pages/app/parts/search.astro                             (new)
/src/pages/app/orders/index.astro                             (new)
/src/pages/app/orders/[id].astro                              (new)
/src/pages/api/parts/search.ts                                (new)
/src/pages/api/orders/create.ts                               (new)
/src/pages/api/orders/[id].ts                                 (new — GET single order)
```

### 6.10 What's stubbed in this slice

- **Driver assignment.** DispatchService just creates a Job and marks the order `pending`. No driver matching. Real logic comes in Phase 3.
- **Real-time tracking.** Order detail page shows static status. No pub/sub yet.
- **SMS notifications.** No SMS sent. Real Twilio integration in Phase 3.
- **Payment capture.** Order is created but not charged. Stripe integration in Phase 4.
- **Supplier inventory.** SupplierInventory is seeded; no live sync. Real sync in Phase 5.

These stubs are intentional. The slice proves the pattern; subsequent phases swap stubs for real implementations.

### 6.11 Acceptance criteria

- [ ] Tech logs in to Acme Auto, navigates to `/app/parts/search`
- [ ] Searches "brake rotor" → sees 3+ supplier results, ranked by ETA
- [ ] Clicks "Order Fastest" → confirms P2, submits
- [ ] Redirected to `/app/orders/[id]` showing pending status, supplier name, part, price, SLA target time
- [ ] Order is persisted in app.db with: `Order` node, `OrderLineItem` node, `Quote` node, `Shop -[PLACED]-> Order`, `User -[CREATED]-> Order`, `Order -[HAS_LINE_ITEM]-> OrderLineItem`, `OrderLineItem -[FROM_SUPPLIER]-> Supplier`, `Order -[QUOTED_FROM]-> Quote`
- [ ] Audit log entry written
- [ ] Viewer role cannot access `/app/parts/search` (redirected to access-denied)
- [ ] Tech from another shop cannot view this order's detail page (forbidden)
- [ ] SuperAdmin can view all orders across shops

---

## 7. Open Decisions and Deferred Items

### Decided in this handoff

- ✅ Domain model (Section 3)
- ✅ Retire video-AI files; rename Organization → Shop
- ✅ Driver as User+Driver pair (auth + operational separated)
- ✅ Job retained for async tasks; new domain types
- ✅ Quote as a first-class node
- ✅ SQLite R-tree for geospatial in MVP; PostGIS later
- ✅ Stripe for billing, BullMQ+Redis for queues, Azure Blob for storage, Twilio for SMS, Mapbox for maps (or Google — pick one)

### Deferred — needs decision before relevant phase

- Real-time pub/sub vendor: Pusher vs Ably vs Supabase Realtime. Decide before Phase 3.
- Supplier rep accounts and supplier admin UI. Defer to Phase 5.
- Multi-location shops (one Owner, multiple physical Shops). Currently model assumes 1 user → 1 primary shop. Add ShopGroup or extended membership later if Fleet Pro shops need it. Probably deferred to post-launch.
- ServiceJob entity (one car repair → multiple orders). Deferred — analytics-grade, not launch-critical.
- Canonical Part catalog with vehicle fitment. Defer; denormalize on OrderLineItem and SupplierInventory for MVP.
- DeliveryZone polygon model. MVP: zip-code groups. Phase 3+: real polygons via Mapbox.
- Driver mobile app vs responsive web. MVP: responsive web. Native app post-launch.
- Multi-tenant supplier inventory (each supplier sees only their own data). Phase 5 — deferred until supplier rep accounts exist.

### Out of scope for this build entirely

- Municipal fleet command center
- EV / used parts / salvage bid aggregation
- ISO referral program tooling (referral links, residual tracking, partner dashboards)
- Multi-market expansion infrastructure

These are all PartsFlow strategic pillars, but they're future phases. Don't build them into the schema or RBAC prematurely.

---

## 8. Reference Files

### From the foundation (data3D_v2 docs to read)

- `/docs/FEATURE_WORKFLOW_SYSTEM_LEVEL_RBAC_GUIDE.md` — page workflow
- `/docs/PROJECT_LEVEL_RBAC.md` — RBAC patterns (note: project-level RBAC not used in PartsFlow MVP)
- `/docs/GLOBAL_ID_ARCHITECTURE.md` — two-DB bridge pattern
- `/docs/GRAPH_DB.md` — graph abstraction layer
- `/docs/design/STITCH_QUICK_REFERENCE.md` — design tokens

### From the foundation (skills to use)

- `.claude/skills/add-feature.md` — scaffolds new pages
- `.claude/skills/stitch.md` — design system
- `.claude/agents/coder.md` — production-quality code agent

### PartsFlow strategic context

- `PARTSFLOW-STRATEGY-MASTER.md` (the four planning docs we worked through earlier — value-based pricing, AOV strategies, ISO referral program, unit economics, market sizing). Reference material for product decisions, not implementation.

### This document

`PARTSFLOW-HANDOFF.md` — start here. Lives at the project root.

---

## Quick-start for the next session

1. Read this document end to end.
2. Confirm the rename plan in Section 4.2 (Organization → Shop, retire list).
3. Execute Phase 0 (Section 5) — clean slate that compiles.
4. Execute Phase 1 (Section 5) — domain model + infrastructure.
5. Execute Phase 2 (Section 6) — first feature end-to-end.

Each phase ends with a summary written to `.claude/summaries/[date]-phase-N-[name].md` per the foundation's pattern.

The `coder` agent should be used for any non-trivial implementation. The `/add-feature` skill should be used for every new page. The `/stitch` skill should be consulted for any UI work.

Branding (colors, logo, domain) is out of scope here and will be themed in a separate thread later. Keep Stitch tokens as-is for now.
