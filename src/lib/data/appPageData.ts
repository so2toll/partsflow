/**
 * Unified Page Data Fetcher for App Pages
 *
 * Centralized data fetching that follows the support/index.astro pattern:
 * - Pages just pass currentPage
 * - This function knows which repositories to call
 * - Returns a generic data object that content components destructure
 *
 * @module lib/data/appPageData
 */

import { organizationRepository } from "../db/repositories/OrganizationRepository";
import { projectRepository } from "../db/repositories/ProjectRepository";
import { teamRepository } from "../db/repositories/TeamRepository";
import { userSubscriptionRepository } from "../db/repositories/UserSubscriptionRepository";
import { graph } from "../db/graph";

export interface PageData {
  organization?: any;
  organizations?: any[];
  projects?: any[];
  teams?: any[];
  project?: any;
  owner?: any;
  stats?: any;
  [key: string]: any; // Allow additional properties
}

/**
 * Get page data based on currentPage
 *
 * This replaces the readapi endpoint pattern for app pages.
 * Pages just call this with currentPage and get back their data.
 */
export async function getPageData(
  currentPage: string,
  userId: string,
  userRole: string,
  organizationId?: string
): Promise<PageData> {
  const isSuperAdmin = userRole === "SuperAdmin";
  const data: PageData = {};

  // Common: always include user info
  data.userId = userId;
  data.userRole = userRole;

  switch (currentPage) {
    case 'appDashboard':
      return getDashboardPageData(isSuperAdmin, organizationId);

    case 'appTeams':
      return getTeamsPageData(isSuperAdmin, organizationId);

    case 'appProjects':
      return getProjectsPageData(isSuperAdmin, organizationId);

    case 'appProjectDetail':
      // For project detail, we need projectId from params
      // This will be called separately with the projectId
      return data;

    case 'appProfile':
      return getProfilePageData(isSuperAdmin, organizationId, userId);

    case 'appProfile2':
      return getProfile2PageData(isSuperAdmin, organizationId, userId);

    case 'appProfile3':
      // Sample profile page - reuses existing profile data
      return getProfilePageData(isSuperAdmin, organizationId, userId);

    case 'componentsLibrary':
      // Components Library is a static showcase page, no data needed
      return data;

    case 'appProfile4':
      return getProfile4PageData(isSuperAdmin, organizationId, userId);

    case 'appDashboardTest':
      return getDashboardTestPageData(isSuperAdmin, organizationId, userId);
    
      case 'appDashboardTestOld':
      return getDashboardTestPageData(isSuperAdmin, organizationId, userId);

    default:
      console.warn(`[getPageData] Unknown page: ${currentPage}`);
      return data;
  }
}

/**
 * Dashboard page data
 */
async function getDashboardPageData(
  isSuperAdmin: boolean,
  organizationId?: string
): Promise<PageData> {
  const data: PageData = {};

  if (isSuperAdmin) {
    // Get all organizations
    const orgsResult = await organizationRepository.list({ limit: 100 });
    data.organizations = orgsResult.organizations;

    // Get all projects
    const projectsResult = await projectRepository.list({ limit: 50 });
    data.projects = projectsResult.projects;

    // Get all teams
    const teamsResult = await teamRepository.list({ limit: 100 });
    data.teams = teamsResult.teams;

    // Get stats
    data.stats = await getSystemStats();
    data.stats.orgCount = orgsResult.total;
    data.stats.projectCount = projectsResult.total;
    data.stats.teamCount = teamsResult.total;

  } else if (organizationId) {
    data.organization = await organizationRepository.findById(organizationId);

    const projectsResult = await projectRepository.findByOrgId(organizationId);
    data.projects = projectsResult.projects;

    const teamsResult = await teamRepository.findByOrgId(organizationId);
    data.teams = teamsResult.teams;

    data.stats = await getOrgStats(organizationId);
    data.stats.projectCount = projectsResult.total;
    data.stats.teamCount = teamsResult.total;
  }

  return data;
}

/**
 * Teams page data
 */
async function getTeamsPageData(
  isSuperAdmin: boolean,
  organizationId?: string
): Promise<PageData> {
  const data: PageData = {};

  if (isSuperAdmin) {
    const teamsResult = await teamRepository.list({ limit: 100 });
    data.teams = teamsResult.teams;

    const projectsResult = await projectRepository.list({ limit: 50 });
    data.projects = projectsResult.projects;

  } else if (organizationId) {
    data.organization = await organizationRepository.findById(organizationId);

    const teamsResult = await teamRepository.findByOrgId(organizationId);
    data.teams = teamsResult.teams;

    const projectsResult = await projectRepository.findByOrgId(organizationId);
    data.projects = projectsResult.projects;
  }

  return data;
}

/**
 * Projects page data
 */
async function getProjectsPageData(
  isSuperAdmin: boolean,
  organizationId?: string
): Promise<PageData> {
  const data: PageData = {};

  if (isSuperAdmin) {
    const projectsResult = await projectRepository.list({ limit: 50 });
    data.projects = projectsResult.projects;

    const teamsResult = await teamRepository.list({ limit: 100 });
    data.teams = teamsResult.teams;

  } else if (organizationId) {
    data.organization = await organizationRepository.findById(organizationId);

    const projectsResult = await projectRepository.findByOrgId(organizationId);
    data.projects = projectsResult.projects;

    const teamsResult = await teamRepository.findByOrgId(organizationId);
    data.teams = teamsResult.teams;
  }

  return data;
}

/**
 * Profile page data
 */
async function getProfilePageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get user details
  if (userId) {
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (userResults.length > 0 && userResults[0].u) {
      const userProps = userResults[0].u.properties;
      data.user = {
        id: userProps.id,
        email: userProps.email,
        name: userProps.name,
        role: userProps.role,
        organizationId: userProps.organizationId,
        createdAt: userProps.createdAt,
      };
    }
  }

  if (isSuperAdmin) {
    // Get system stats for SuperAdmin
    data.stats = await getSystemStats();

    // Get all organizations
    const orgsResult = await organizationRepository.list({ limit: 100 });
    data.organizations = orgsResult.organizations;

  } else if (organizationId) {
    // Get organization for regular users
    data.organization = await organizationRepository.findById(organizationId);

    // Get org stats
    data.stats = await getOrgStats(organizationId);
  }

  return data;
}

/**
 * Profile2 page data - TEST PAGE
 */
async function getProfile2PageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get user details
  if (userId) {
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (userResults.length > 0 && userResults[0].u) {
      const userProps = userResults[0].u.properties;
      data.user = {
        id: userProps.id,
        email: userProps.email,
        name: userProps.name,
        role: userProps.role,
        organizationId: userProps.organizationId,
        createdAt: userProps.createdAt,
      };
    }
  }

  if (isSuperAdmin) {
    // SuperAdmin gets all users view
    const allUsersResults = await graph.query<any>(
      `
      MATCH (u:User)
      RETURN u
      ORDER BY u.createdAt DESC
      LIMIT 50
      `
    );
    data.allUsers = allUsersResults.map(r => ({
      id: r.u.properties.id,
      email: r.u.properties.email,
      name: r.u.properties.name,
      role: r.u.properties.role,
      organizationId: r.u.properties.organizationId,
      createdAt: r.u.properties.createdAt,
    }));

    // Get all organizations
    const orgsResult = await organizationRepository.list({ limit: 100 });
    data.organizations = orgsResult.organizations;

  } else if (organizationId) {
    // Regular User gets their own profile view
    data.organization = await organizationRepository.findById(organizationId);

    // Get org stats
    data.stats = await getOrgStats(organizationId);
  }

  return data;
}

/**
 * Profile4 page data - PRACTICE PAGE
 * Demonstrates the workflow pattern and RBAC view switching
 */
async function getProfile4PageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get current time for dynamic content
  data.currentTime = new Date().toISOString();
  data.displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get user details
  if (userId) {
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (userResults.length > 0 && userResults[0].u) {
      const userProps = userResults[0].u.properties;
      data.user = {
        id: userProps.id,
        email: userProps.email,
        name: userProps.name,
        role: userProps.role,
        organizationId: userProps.organizationId,
        createdAt: userProps.createdAt,
      };
    }
  }

  if (isSuperAdmin) {
    // SuperAdmin gets extended system view
    data.isAdmin = true;
    data.adminMessage = "You are viewing this page as a SuperAdmin with elevated privileges.";

    // Get all organizations
    const orgsResult = await organizationRepository.list({ limit: 100 });
    data.organizations = orgsResult.organizations;

    // Get system stats
    data.stats = await getSystemStats();

  } else if (organizationId) {
    // Regular User gets their own profile view
    data.isAdmin = false;
    data.userMessage = "You are viewing this page as a regular User.";

    // Get organization
    data.organization = await organizationRepository.findById(organizationId);

    // Get org stats
    data.stats = await getOrgStats(organizationId);
  }

  return data;
}

/**
 * Project detail page data
 * Called separately with projectId
 */
export async function getProjectDetailPageData(
  projectId: string,
  userId: string
): Promise<PageData | null> {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    return null;
  }

  const teams = await projectRepository.getTeams(projectId);

  // Get project owner
  const ownerResults = await graph.query<any>(
    `
    MATCH (u:User)-[:OWNS]->(p:Project {id: $projectId})
    RETURN u
    `,
    { projectId }
  );

  const owner = ownerResults.length > 0 ? ownerResults[0].u.properties : null;

  // Get organization
  const orgResults = await graph.query<any>(
    `
    MATCH (o:Organization)-[:HAS_PROJECT]->(p:Project {id: $projectId})
    RETURN o
    `,
    { projectId }
  );

  const org = orgResults.length > 0 ? orgResults[0].o.properties : null;

  return {
    project,
    teams,
    organization: org,
    owner
  };
}

/**
 * Dashboard Test page data - MotoFlow Operations Dashboard
 */
async function getDashboardTestPageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get user details
  if (userId) {
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (userResults.length > 0 && userResults[0].u) {
      const userProps = userResults[0].u.properties;
      data.user = {
        id: userProps.id,
        email: userProps.email,
        name: userProps.name,
        role: userProps.role,
        organizationId: userProps.organizationId,
      };
    }
  }

  // MotoFlow operations dashboard data
  // This would typically fetch orders, drivers, stats from repositories
  // For now, we provide mock data that matches the design
  data.operations = {
    revenue: 12840,
    activeOrders: 142,
    driversOnline: 28,
    slaStatus: 98.2,
    urgentShipments: 8,
    idleUnits: 4,
    criticalZone: 'F',
  };

  // Mock live order feed
  data.liveOrders = [
    {
      id: 'order-001',
      priority: 'P0',
      priorityLabel: '[P0 EMERGENCY]',
      eta: 4,
      title: 'Brake Booster - BPD District 3',
      driver: { initials: 'SK', name: 'Sarah K.' },
      status: 'en-route',
      statusLabel: 'EN ROUTE',
    },
    {
      id: 'order-002',
      priority: 'P2',
      priorityLabel: '[P2 STANDARD]',
      eta: 12,
      title: 'Oil Filter x10 - Main St Auto',
      driver: { initials: 'AI', name: 'Auto' },
      status: 'picked-up',
      statusLabel: 'PICKED UP',
    },
    {
      id: 'order-003',
      priority: 'P1',
      priorityLabel: '[P1 URGENT]',
      eta: 9,
      title: 'Fuel Pump - SpeedTech Garage',
      driver: { initials: 'MD', name: 'Marcus D.' },
      status: 'dispatched',
      statusLabel: 'DISPATCHED',
    },
  ];

  // Mock unassigned orders queue
  data.unassignedOrders = [
    { id: '9401', priority: 'P0', title: 'Radiator Assembly', distance: '0.8 mi', waiting: '2m' },
    { id: '9405', priority: 'P1', title: 'Spark Plugs (Set of 8)', distance: '2.4 mi', waiting: '5m' },
    { id: '9408', priority: 'P2', title: 'Synthetic Oil 5W-30', distance: '1.1 mi', waiting: '8m' },
    { id: '9412', priority: 'P2', title: 'Windshield Wipers', distance: '4.2 mi', waiting: '12m' },
  ];

  return data;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getSystemStats() {
  const [userResults] = await Promise.all([
    graph.query<any>("MATCH (u:User) RETURN count(u) as count"),
  ]);

  return {
    userCount: userResults[0]?.count || 0,
  };
}

async function getOrgStats(_organizationId: string) {
  return {
    videoCount: 0,
    highlightCount: 0,
  };
}
