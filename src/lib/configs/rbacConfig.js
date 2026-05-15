

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
import AppSettings from '../../content-container/App/Settings.astro';
import AppOperationsDashboard from '../../content-container/App/OperationsDashboard.astro';
import AppOperationsDashboardOld from '../../content-container/App/OperationsDashboard_old.astro';


// Content for Shop Pages (MotoFlow)
import PartsSearch from '../../content-container/Shop/PartsSearch.astro';
import OrdersList from '../../content-container/Shop/OrdersList.astro';
import OrderDetail from '../../content-container/Shop/OrderDetail.astro';

// Content for Driver Pages (MotoFlow)
import DriverDashboard from '../../content-container/Driver/DriverDashboard.astro';

// Content for Admin Pages (MotoFlow)
import DispatchManagement from '../../content-container/Admin/DispatchManagement.astro';

// Blank Content
import Blank from '../../content-container/Blank/Content.astro';

// Footer Content
import Footer from '../../layouts/Dashboard/Footer.astro';

// App Top Nav
import AppTopNav from '../../layouts/Dashboard/AppTopNav.astro';

// Stitch Design System Navigation
import StitchTopNav from '../../layouts/Dashboard/StitchTopNav.astro';
import StitchSideNav from '../../layouts/Dashboard/StitchSideNav.astro';
import StitchTopNavOld from '../../layouts/Dashboard/StitchTopNavOld.astro';
import StitchSideNavOld from '../../layouts/Dashboard/StitchSideNav_Old.astro';

// Driver Navigation
import DriverSideNav from '../../layouts/Dashboard/DriverSideNav.astro';

// Admin Components
import InviteManagement from '../../content-container/Admin/InviteManagement.astro';


// rbacConfig.js
export const RBAC_CONFIG = {

  // Admin: {
  //     dashboard: {
  //       topNav: Blank,
  //       sideNav: AdminSideNav,
  //       content: ConsoleContent,
  //       footer: Footer,
  //       title: "Admin Dashboard",
  //       description: "Admin Dashboard",
  //     },
  //     apiKeys: {
  //       topNav: Blank,
  //       sideNav: SideNav,
  //       content: AdminApiKeysContent,
  //       footer: Footer,
  //       title: "API Keys Management",
  //       description: "Manage client API keys and credentials",
  //     },
  
  //     console: {
  //       topNav: Blank,
  //       sideNav: SideNav,
  //       content: ConsoleContent,
  //       footer: Footer,
  //       title: "Admin Console",
  //       description: "Admin Console for Internal Staff",
   
  //     },
  //   },
    
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
      appDashboardTest: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppOperationsDashboard,
        footer: Blank,
        title: "Operations Dashboard",
        description: "MotoFlow Operations Control Room - Test Page",
      },
      // Admin Invite Management (SuperAdmin only)
      adminInvites: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: InviteManagement,
        footer: Blank,
        title: "Invite Management",
        description: "Generate and manage invite links for Shop Owners and Drivers",
      },
      // MotoFlow Dispatch Management (SuperAdmin only)
      adminDispatch: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: DispatchManagement,
        footer: Blank,
        title: "Dispatch Management",
        description: "Assign orders to drivers and monitor fleet",
      },
    },


    // Video AI Content Studio Roles
    // StudioAdmin: {
    //   dashboard: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Studio Dashboard",
    //     description: "Video AI Content Studio Dashboard",
    //   },
    //   teams: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Teams",
    //     description: "Manage your studio teams",
    //   },
    //   projects: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Projects",
    //     description: "Manage your studio projects",
    //   },
    //   // App pages
    //   appDashboard: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppDashboard,
    //     footer: Blank,
    //     title: "Dashboard",
    //     description: "Video AI Content Studio Dashboard",
    //   },
    //   appTeams: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppTeams,
    //     footer: Blank,
    //     title: "Teams",
    //     description: "Manage your teams",
    //   },
    //   appProjects: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProjects,
    //     footer: Blank,
    //     title: "Projects",
    //     description: "Manage your projects",
    //   },
    //   appProjectDetail: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProjectDetail,
    //     footer: Blank,
    //     title: "Project Details",
    //     description: "View project details",
    //   },
    //   appProfile: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProfile,
    //     footer: Blank,
    //     title: "Profile",
    //     description: "View your profile",
    //   },
    //   appProfile3: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProfile,
    //     footer: Blank,
    //     title: "Profile3 (Sample)",
    //     description: "Sample profile page demonstrating copy-paste pattern",
    //   },
    // },

    ShopOwner: {
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
        content: AppOperationsDashboard,
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
      appSettings: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppSettings,
        footer: Blank,
        title: "Settings",
        description: "Manage your account settings",
      },
      appDashboardTest: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: AppOperationsDashboard,
        footer: Blank,
        title: "Dashboard",
        description: "Manage your auto shop business",
      },
        appDashboardTestOld: {
        topNav: StitchTopNavOld,
        sideNav: StitchSideNavOld,
        content: AppOperationsDashboardOld,
        footer: Blank,
        title: "Operations Dashboard",
        description: "MotoFlow Operations Control Room - Test Page",
      },
      // MotoFlow Shop Pages
      partsSearch: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: PartsSearch,
        footer: Blank,
        title: "Parts Search",
        description: "Search for parts and place orders for delivery",
      },
      ordersList: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: OrdersList,
        footer: Blank,
        title: "Orders",
        description: "Manage your parts delivery orders",
      },
      orderDetail: {
        topNav: StitchTopNav,
        sideNav: StitchSideNav,
        content: OrderDetail,
        footer: Blank,
        title: "Order Details",
        description: "View order details and track delivery",
      },
    },

    // StudioViewer: {
    //   dashboard: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Studio Dashboard",
    //     description: "Video AI Content Studio Dashboard",
    //   },
    //   teams: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Teams",
    //     description: "View teams",
    //   },
    //   projects: {
    //     topNav: Blank,
    //     sideNav: Blank,
    //     content: Blank,
    //     footer: Footer,
    //     title: "Projects",
    //     description: "View projects only",
    //   },
    //   // App pages
    //   appDashboard: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppDashboard,
    //     footer: Blank,
    //     title: "Dashboard",
    //     description: "Video AI Content Studio Dashboard",
    //   },
    //   appTeams: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppTeams,
    //     footer: Blank,
    //     title: "Teams",
    //     description: "View your teams",
    //   },
    //   appProjects: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProjects,
    //     footer: Blank,
    //     title: "Projects",
    //     description: "View your projects",
    //   },
    //   appProjectDetail: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProjectDetail,
    //     footer: Blank,
    //     title: "Project Details",
    //     description: "View project details",
    //   },
    //   appProfile: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProfile,
    //     footer: Blank,
    //     title: "Profile",
    //     description: "View your profile",
    //   },
    //   appProfile3: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppProfile,
    //     footer: Blank,
    //     title: "Profile3 (Sample)",
    //     description: "Sample profile page demonstrating copy-paste pattern",
    //   },
    //   appDashboardTest: {
    //     topNav: StitchTopNav,
    //     sideNav: StitchSideNav,
    //     content: AppOperationsDashboard,
    //     footer: Blank,
    //     title: "Operations Dashboard",
    //     description: "MotoFlow Operations Control Room - Test Page",
    //   },
    //   appDashboardTestOld: {
    //     topNav: StitchTopNavOld,
    //     sideNav: StitchSideNavOld,
    //     content: AppOperationsDashboardOld,
    //     footer: Blank,
    //     title: "Operations Dashboard",
    //     description: "MotoFlow Operations Control Room - Test Page",
    //   },
    // },

    // Driver Role - For delivery drivers
    Driver: {
      // Main Dashboard - same URL as everyone else, role-specific content
      appDashboardTest: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: DriverDashboard,
        footer: Blank,
        title: "Driver Dashboard",
        description: "View and manage your deliveries",
      },
      // Legacy route for backwards compatibility - redirects to main dashboard
      driverDashboard: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: DriverDashboard,
        footer: Blank,
        title: "Driver Dashboard",
        description: "View and manage your deliveries",
      },
      // Driver Deliveries - List of assigned deliveries
      driverDeliveries: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: Blank, // Will be replaced with DriverDeliveries component
        footer: Blank,
        title: "My Deliveries",
        description: "View your assigned deliveries",
      },
      // Driver Profile - Personal profile settings
      appProfile: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "Manage your profile settings",
      },
      appSettings: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: AppSettings,
        footer: Blank,
        title: "Settings",
        description: "Manage your account settings",
      },
      // Legacy route for backwards compatibility
      driverProfile: {
        topNav: StitchTopNav,
        sideNav: DriverSideNav,
        content: AppProfile,
        footer: Blank,
        title: "Profile",
        description: "Manage your profile settings",
      },
    },


  };