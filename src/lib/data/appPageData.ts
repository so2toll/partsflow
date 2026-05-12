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
import { characterRepository } from "../db/repositories/CharacterRepository";
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

    case 'appCharacters':
      return getCharactersPageData(isSuperAdmin, organizationId, userId);

    case 'appVideoEdit':
      return getVideoEditPageData(isSuperAdmin, organizationId, userId);

    case 'appVideoProgress':
      // For video progress, the page handles its own data fetching with projectId from params
      // This returns minimal data for consistency
      return data;

    case 'appNewVideo':
      return getNewVideoPageData(isSuperAdmin, organizationId, userId);

    case 'appUpload':
      return getUploadPageData(isSuperAdmin, organizationId, userId);

    case 'appBilling':
      return getBillingPageData(isSuperAdmin, organizationId, userId);

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
 * Characters page data - Character Library
 */
async function getCharactersPageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get current user info
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

  if (isSuperAdmin) {
    // SuperAdmin sees all characters across all organizations
    // Get all organizations first
    const orgsResult = await organizationRepository.list({ limit: 50 });
    data.organizations = orgsResult.organizations;

    // Aggregate characters from all organizations
    const allCharacters: any[] = [];
    for (const org of orgsResult.organizations) {
      const charactersResult = await characterRepository.findByOrgId(org.id);
      allCharacters.push(...charactersResult.characters);
    }
    data.characters = allCharacters;

  } else if (organizationId) {
    // Regular users see their organization's characters
    const charactersResult = await characterRepository.findByOrgId(organizationId);
    data.characters = charactersResult.characters;

    // Get organization for context
    data.organization = await organizationRepository.findById(organizationId);
  }

  return data;
}

/**
 * Video Edit page data - Phase 4 Demo
 */
async function getVideoEditPageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // For demo purposes, we'll return minimal data
  // The actual demo functionality is client-side with mock data
  data.isDemo = true;
  data.demoMode = 'edit';
  data.userId = userId;
  data.userRole = isSuperAdmin ? 'SuperAdmin' : 'User';

  // Skip database queries for the demo to avoid potential issues
  // The component has built-in mock data

  return data;
}

/**
 * New Video Project page data
 */
async function getNewVideoPageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get user subscription data
  if (userId) {
    data.subscription = await userSubscriptionRepository.getSubscription(userId);
  }

  // Get characters for the character selector
  if (isSuperAdmin) {
    // SuperAdmin can see all characters
    const orgsResult = await organizationRepository.list({ limit: 50 });
    const allCharacters: any[] = [];
    for (const org of orgsResult.organizations) {
      const charactersResult = await characterRepository.findByOrgId(org.id);
      allCharacters.push(...charactersResult.characters);
    }
    data.characters = allCharacters;
    data.organizations = orgsResult.organizations;

  } else if (organizationId) {
    // Regular users see their organization's characters
    const charactersResult = await characterRepository.findByOrgId(organizationId);
    data.characters = charactersResult.characters;
    data.organization = await organizationRepository.findById(organizationId);
  } else {
    // No organization - return empty characters
    data.characters = [];
  }

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
 * Video progress page data
 * Called separately with projectId from route params
 */
export async function getVideoProgressPageData(
  projectId: string,
  userId: string
): Promise<PageData | null> {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    return null;
  }

  // Calculate progress percentage
  let progress = 0;
  const videoStatus = (project as any).videoStatus;
  const totalScenes = (project as any).totalScenes || 1;
  const completedScenes = (project as any).completedScenes || 0;

  if (videoStatus === 'completed') {
    progress = 100;
  } else if (videoStatus === 'generating' || videoStatus === 'rendering') {
    progress = Math.round((completedScenes / totalScenes) * 80) + 10;
  } else if (videoStatus === 'scripted') {
    progress = 10;
  }

  // Get job status (mock for now)
  const jobStatus = {
    state: videoStatus || 'draft',
    progress: progress,
  };

  // Check if user can edit (is owner or SuperAdmin)
  const canEdit = (project as any).createdBy === userId;

  return {
    project,
    jobStatus,
    progress,
    canEdit,
  };
}

/**
 * Upload page data - Video AI Edit Mode Upload
 */
async function getUploadPageData(
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

  // Get organization for context
  if (organizationId) {
    data.organization = await organizationRepository.findById(organizationId);
  }

  // Get user subscription for upload limits
  if (userId) {
    data.subscription = await userSubscriptionRepository.getSubscription(userId);
  }

  return data;
}

/**
 * Billing page data - Subscription Management
 */
async function getBillingPageData(
  isSuperAdmin: boolean,
  organizationId?: string,
  userId?: string
): Promise<PageData> {
  const data: PageData = {};

  // Get user subscription data
  if (userId) {
    data.subscription = await userSubscriptionRepository.getSubscription(userId);
  }

  // Get payment history (stub for now - will be populated from Stripe)
  // In production, this would fetch from Stripe API or cache
  data.paymentHistory = [];

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

  // Get organization for context
  if (organizationId) {
    data.organization = await organizationRepository.findById(organizationId);
  }

  return data;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getSystemStats() {
  const [userResults, videoResults, highlightResults] = await Promise.all([
    graph.query<any>("MATCH (u:User) RETURN count(u) as count"),
    graph.query<any>(
      "MATCH (p:Project)-[:HAS_VIDEO]->(v:Video) RETURN count(v) as count"
    ),
    graph.query<any>(
      "MATCH (v:Video)-[:HAS_HIGHLIGHT]->(h:Highlight) RETURN count(h) as count"
    ),
  ]);

  return {
    userCount: userResults[0]?.count || 0,
    videoCount: videoResults[0]?.count || 0,
    highlightCount: highlightResults[0]?.count || 0,
  };
}

async function getOrgStats(organizationId: string) {
  const [videoResults, highlightResults] = await Promise.all([
    graph.query<any>(
      `
      MATCH (org:Organization {id: $orgId})-[:HAS_PROJECT]->(p:Project)-[:HAS_VIDEO]->(v:Video)
      RETURN count(v) as count
      `,
      { orgId: organizationId }
    ),
    graph.query<any>(
      `
      MATCH (org:Organization {id: $orgId})-[:HAS_PROJECT]->(p:Project)-[:HAS_VIDEO]->(v:Video)-[:HAS_HIGHLIGHT]->(h:Highlight)
      RETURN count(h) as count
      `,
      { orgId: organizationId }
    ),
  ]);

  return {
    videoCount: videoResults[0]?.count || 0,
    highlightCount: highlightResults[0]?.count || 0,
  };
}
