

// Layouts for Owner

import TopNav from '../../layouts/Dashboard/TopNav.astro';
import SideNav from '../../layouts/Dashboard/SideNav.astro';
import AdminSideNav from '../../layouts/Dashboard/AdminSideNav.astro';

// Content for Admin Console
import ConsoleContent from '../../pages/app/dashboard.astro';

// Content for Admin API Keys
import AdminApiKeysContent from '../../content-container/Admin/ApiKeys.astro';

// Content for Components Library (SuperAdmin only)
import ComponentsLibrary from '../../content-container/Admin/ComponentsLibrary.astro';

// Content for App Pages
import AppDashboard from '../../content-container/App/Dashboard.astro';
import AppTeams from '../../content-container/App/Teams.astro';
import AppProjects from '../../content-container/App/Projects.astro';
import AppProjectDetail from '../../content-container/App/ProjectDetail.astro';
import AppProfile from '../../content-container/App/Profile.astro';
import AppProfile2 from '../../content-container/App/Profile2.astro';
import AppProfile4 from '../../content-container/App/Profile4.astro';

// Blank Content
import Blank from '../../content-container/Blank/Content.astro';

// Footer Content
import Footer from '../../layouts/Dashboard/Footer.astro';

// App Top Nav
import AppTopNav from '../../layouts/Dashboard/AppTopNav.astro';

// Stitch Design System Navigation
import StitchTopNav from '../../layouts/Dashboard/StitchTopNav.astro';
import StitchSideNav from '../../layouts/Dashboard/StitchSideNav.astro';

// Content for Video AI Pages
import NewVideoProject from '../../content-container/App/NewVideoProject.astro';
import AppCharacters from '../../content-container/App/Characters.astro';
import AppVideoEdit from '../../content-container/App/VideoEdit.astro';
import AppVideoProgress from '../../content-container/App/VideoProgress.astro';
import AppUpload from '../../content-container/App/Upload.astro';
import AppBilling from '../../content-container/App/Billing.astro';



// rbacConfig.js
export const RBAC_CONFIG = {

  Admin: {
      dashboard: {
        topNav: Blank,
        sideNav: AdminSideNav,
        content: ConsoleContent,
        footer: Footer,
        title: "Admin Dashboard",
        description: "Admin Dashboard",
      },
      apiKeys: {
        topNav: Blank,
        sideNav: SideNav,
        content: AdminApiKeysContent,
        footer: Footer,
        title: "API Keys Management",
        description: "Manage client API keys and credentials",
      },
  
      console: {
        topNav: Blank,
        sideNav: SideNav,
        content: ConsoleContent,
        footer: Footer,
        title: "Admin Console",
        description: "Admin Console for Internal Staff",
   
      },
    },
    
   SuperAdmin: {
      dashboard: {
        topNav: Blank,
        sideNav: AdminSideNav,
        content: ConsoleContent,
        footer: Footer,
        title: "SuperAdmin Dashboard",
        description: "SuperAdmin Dashboard",
      },
      apiKeys: {
        topNav: Blank,
        sideNav: SideNav,
        content: AdminApiKeysContent,
        footer: Footer,
        title: "API Keys Management",
        description: "Manage client API keys and credentials",
      },

      console: {
        topNav: Blank,
        sideNav: SideNav,
        content: ConsoleContent,
        footer: Footer,
        title: "SuperAdmin Console",
        description: "SuperAdmin Console for Internal Staff",

      },
      // Components Library (SuperAdmin only)
      componentsLibrary: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: ComponentsLibrary,
        footer: Blank,
        title: "Components Library",
        description: "UI Components Library - Stitch Design System",
      },
      // App pages
      appDashboard: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppDashboard,
        footer: Blank,
        title: "System Dashboard",
        description: "Video AI Content Studio - System Wide View",
      },
      appTeams: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppTeams,
        footer: Blank,
        title: "Teams",
        description: "Manage all teams",
      },
      appProjects: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjects,
        footer: Blank,
        title: "Projects",
        description: "Manage all projects",
      },
      appProjectDetail: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjectDetail,
        footer: Blank,
        title: "Project Details",
        description: "View project details",
      },
      appProfile: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "View your profile",
      },
      appProfile2: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile2,
        footer: Blank,
        title: "Profile2",
        description: "View all users (SuperAdmin)",
      },
      appProfile3: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile3 (Sample)",
        description: "Sample profile page demonstrating copy-paste pattern",
      },
      appProfile4: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile4,
        footer: Blank,
        title: "Profile4 (Practice)",
        description: "Practice page demonstrating feature workflow and RBAC view switching - SuperAdmin View",
      },
      appNewVideo: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: NewVideoProject,
        footer: Blank,
        title: "Create New Video",
        description: "Create a new AI-generated video project",
      },
      appCharacters: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppCharacters,
        footer: Blank,
        title: "Characters",
        description: "Manage all characters across all organizations",
      },
      appVideoEdit: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoEdit,
        footer: Blank,
        title: "Video Edit Mode",
        description: "Edit and index videos with AI-powered search and clip management",
      },
      appVideoProgress: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoProgress,
        footer: Blank,
        title: "Video Generation Progress",
        description: "Track video generation progress in real-time",
      },
      appUpload: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppUpload,
        footer: Blank,
        title: "Upload Video",
        description: "Upload videos for AI-powered editing and highlight generation",
      },
      appBilling: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppBilling,
        footer: Blank,
        title: "Billing & Subscription",
        description: "Manage your subscription plan and billing - SuperAdmin View",
      },
    },


    // Video AI Content Studio Roles
    StudioAdmin: {
      dashboard: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Studio Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      teams: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Teams",
        description: "Manage your studio teams",
      },
      projects: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Projects",
        description: "Manage your studio projects",
      },
      // App pages
      appDashboard: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppDashboard,
        footer: Blank,
        title: "Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      appTeams: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppTeams,
        footer: Blank,
        title: "Teams",
        description: "Manage your teams",
      },
      appProjects: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjects,
        footer: Blank,
        title: "Projects",
        description: "Manage your projects",
      },
      appProjectDetail: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjectDetail,
        footer: Blank,
        title: "Project Details",
        description: "View project details",
      },
      appProfile: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "View your profile",
      },
      appProfile3: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile3 (Sample)",
        description: "Sample profile page demonstrating copy-paste pattern",
      },
      appNewVideo: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: NewVideoProject,
        footer: Blank,
        title: "Create New Video",
        description: "Create a new AI-generated video project",
      },
      appCharacters: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppCharacters,
        footer: Blank,
        title: "Characters",
        description: "Manage characters for your organization",
      },
      appVideoEdit: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoEdit,
        footer: Blank,
        title: "Video Edit Mode",
        description: "Edit and index videos with AI-powered search and clip management",
      },
      appVideoProgress: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoProgress,
        footer: Blank,
        title: "Video Generation Progress",
        description: "Track video generation progress in real-time",
      },
      appUpload: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppUpload,
        footer: Blank,
        title: "Upload Video",
        description: "Upload videos for AI-powered editing and highlight generation",
      },
      appBilling: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppBilling,
        footer: Blank,
        title: "Billing & Subscription",
        description: "Manage your subscription plan and billing",
      },
    },

    User: {
      dashboard: {
        topNav: Blank,
        sideNav: Blank,
        content: ConsoleContent,
        footer: Footer,
        title: "Studio Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      teams: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Teams",
        description: "View your teams",
      },
      projects: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Projects",
        description: "View your projects",
      },
      // App pages
      appDashboard: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppDashboard,
        footer: Blank,
        title: "Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      appTeams: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppTeams,
        footer: Blank,
        title: "Teams",
        description: "Manage your teams",
      },
      appProjects: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjects,
        footer: Blank,
        title: "Projects",
        description: "Manage your projects",
      },
      appProjectDetail: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjectDetail,
        footer: Blank,
        title: "Project Details",
        description: "View project details",
      },
      appProfile: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "View your profile",
      },
      appProfile2: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile2,
        footer: Blank,
        title: "Profile2",
        description: "View your profile2",
      },
      appProfile3: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile3 (Sample)",
        description: "Sample profile page demonstrating copy-paste pattern",
      },
      appProfile4: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile4,
        footer: Blank,
        title: "Profile4 (Practice)",
        description: "Practice page demonstrating feature workflow and RBAC view switching - User View",
      },
      appNewVideo: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: NewVideoProject,
        footer: Blank,
        title: "Create New Video",
        description: "Create a new AI-generated video project",
      },
      appCharacters: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppCharacters,
        footer: Blank,
        title: "Characters",
        description: "Manage characters for your organization",
      },
      appVideoEdit: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoEdit,
        footer: Blank,
        title: "Video Edit Mode",
        description: "Edit and index videos with AI-powered search and clip management",
      },
      appVideoProgress: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoProgress,
        footer: Blank,
        title: "Video Generation Progress",
        description: "Track video generation progress in real-time",
      },
      appUpload: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppUpload,
        footer: Blank,
        title: "Upload Video",
        description: "Upload videos for AI-powered editing and highlight generation",
      },
      appBilling: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppBilling,
        footer: Blank,
        title: "Billing & Subscription",
        description: "Manage your subscription plan and billing",
      },
    },

    StudioViewer: {
      dashboard: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Studio Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      teams: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Teams",
        description: "View teams",
      },
      projects: {
        topNav: Blank,
        sideNav: Blank,
        content: Blank,
        footer: Footer,
        title: "Projects",
        description: "View projects only",
      },
      // App pages
      appDashboard: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppDashboard,
        footer: Blank,
        title: "Dashboard",
        description: "Video AI Content Studio Dashboard",
      },
      appTeams: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppTeams,
        footer: Blank,
        title: "Teams",
        description: "View your teams",
      },
      appProjects: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjects,
        footer: Blank,
        title: "Projects",
        description: "View your projects",
      },
      appProjectDetail: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProjectDetail,
        footer: Blank,
        title: "Project Details",
        description: "View project details",
      },
      appProfile: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "View your profile",
      },
      appProfile3: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile3 (Sample)",
        description: "Sample profile page demonstrating copy-paste pattern",
      },
      appNewVideo: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: NewVideoProject,
        footer: Blank,
        title: "Create New Video",
        description: "Create a new AI-generated video project",
      },
      appVideoEdit: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoEdit,
        footer: Blank,
        title: "Video Edit Mode",
        description: "Edit and index videos with AI-powered search and clip management",
      },
      appVideoProgress: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppVideoProgress,
        footer: Blank,
        title: "Video Generation Progress",
        description: "Track video generation progress in real-time",
      },
      appUpload: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppUpload,
        footer: Blank,
        title: "Upload Video",
        description: "Upload videos for AI-powered editing and highlight generation",
      },
      appBilling: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppBilling,
        footer: Blank,
        title: "Billing & Subscription",
        description: "View your subscription plan and billing",
      },
    },



  };

// ============================================================================
// Video AI Permission-Based RBAC
// ============================================================================

/**
 * Action-based permissions for Video AI features
 * Format: 'resource:action'
 */
export const VIDEO_AI_PERMISSIONS = {
  // Video permissions
  VIDEO_CREATE: 'video:create',
  VIDEO_READ: 'video:read',
  VIDEO_UPDATE: 'video:update',
  VIDEO_DELETE: 'video:delete',
  VIDEO_GENERATE: 'video:generate',

  // Character permissions
  CHARACTER_CREATE: 'character:create',
  CHARACTER_READ: 'character:read',
  CHARACTER_UPDATE: 'character:update',
  CHARACTER_DELETE: 'character:delete',

  // Asset permissions
  ASSET_UPLOAD: 'asset:upload',
  ASSET_READ: 'asset:read',
  ASSET_DELETE: 'asset:delete',

  // Billing permissions
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',

  // Usage permissions
  USAGE_READ: 'usage:read',
  USAGE_EXPORT: 'usage:export',
};

/**
 * Role definitions with permissions
 */
export const VIDEO_AI_ROLES = {
  SuperAdmin: {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: ['*'], // All permissions
  },

  StudioAdmin: {
    name: 'Studio Admin',
    description: 'Organization owner with full Video AI access',
    permissions: [
      // All Video AI permissions
      'video:*',
      'character:*',
      'asset:*',
      'billing:*',
      'usage:*',
    ],
  },

  User: {
    name: 'User',
    description: 'Standard user with creation and editing access',
    permissions: [
      // Video permissions
      'video:create',
      'video:read',
      'video:update',
      'video:generate',
      // Character permissions
      'character:create',
      'character:read',
      'character:update',
      // Asset permissions
      'asset:upload',
      'asset:read',
      // Usage viewing
      'usage:read',
    ],
  },

  StudioViewer: {
    name: 'Studio Viewer',
    description: 'Read-only access to Video AI content',
    permissions: [
      'video:read',
      'character:read',
      'asset:read',
      'usage:read',
    ],
  },

  // New Video AI specific roles
  Creator: {
    name: 'Creator',
    description: 'Video creator with generation access',
    permissions: [
      'video:create',
      'video:read',
      'video:update',
      'video:generate',
      'character:create',
      'character:read',
      'character:update',
      'asset:upload',
      'asset:read',
      'usage:read',
    ],
  },

  BillingAdmin: {
    name: 'Billing Admin',
    description: 'Manages billing and subscriptions',
    permissions: [
      'billing:*',
      'usage:*',
    ],
  },
};

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  videos: {
    label: 'Videos',
    permissions: [
      VIDEO_AI_PERMISSIONS.VIDEO_CREATE,
      VIDEO_AI_PERMISSIONS.VIDEO_READ,
      VIDEO_AI_PERMISSIONS.VIDEO_UPDATE,
      VIDEO_AI_PERMISSIONS.VIDEO_DELETE,
      VIDEO_AI_PERMISSIONS.VIDEO_GENERATE,
    ],
  },
  characters: {
    label: 'Characters',
    permissions: [
      VIDEO_AI_PERMISSIONS.CHARACTER_CREATE,
      VIDEO_AI_PERMISSIONS.CHARACTER_READ,
      VIDEO_AI_PERMISSIONS.CHARACTER_UPDATE,
      VIDEO_AI_PERMISSIONS.CHARACTER_DELETE,
    ],
  },
  assets: {
    label: 'Assets',
    permissions: [
      VIDEO_AI_PERMISSIONS.ASSET_UPLOAD,
      VIDEO_AI_PERMISSIONS.ASSET_READ,
      VIDEO_AI_PERMISSIONS.ASSET_DELETE,
    ],
  },
  billing: {
    label: 'Billing',
    permissions: [
      VIDEO_AI_PERMISSIONS.BILLING_READ,
      VIDEO_AI_PERMISSIONS.BILLING_MANAGE,
    ],
  },
  usage: {
    label: 'Usage',
    permissions: [
      VIDEO_AI_PERMISSIONS.USAGE_READ,
      VIDEO_AI_PERMISSIONS.USAGE_EXPORT,
    ],
  },
};