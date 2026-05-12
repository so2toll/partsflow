// // Importing the necessary components
// import TopNav from '../../layouts/TopNav.astro';
// import SideNav from '../../layouts/Entities/Agency/SideNav.astro';


// //Dashboard Content
// import AgencyDashboardContent from '../../content-container/Dashboard/AgencyContent.astro';
// import AdminDashboardContent from '../../content-container/Dashboard/AdminContent.astro';
// import InmateDashboardContent from '../../content-container/Dashboard/InmateContent.astro';

// //Onboard Content
// import AgencyOnboardContent from '../../content-container/Onboard/AgencyContent.astro';


// //Blank Content
// import Blank from '../../content-container/Blank/AgencyContent.astro';

// import Footer from '../../layouts/Footer.astro';

// // rbacConfig.js
// export const USER_FLAG_CONFIG = {
//   //Onboarding Flags & Notifications
//     admin: {
//       dashboard: {
//         topNav: TopNav,
//         sideNav: SideNav,
//         content: AdminDashboardContent,
//       },
//       // ... other pages for admin
//     },
//     agency: {
//       //Welcome Flags & Notifications
//       user_first_login: {
//         topNav: Blank,
//         sideNav: Blank,
//         content: AgencyOnboardContent,
//         footer: Blank,
//         title: "Data3D | Onboard",
//         description: "Insight3d Onboard",
//       },
//       workspace_not_set: {
//         topNav: TopNav,
//         sideNav: SideNav,
//         content: AgencyDashboardContent,
//         footer: Footer,
//         title: "Data3D | Dashboard",
//         description: "Insight3d Dashboard",
//       },
//       document: {
//         topNav: TopNav,
//         sideNav: SideNav,
//         content: AgencyDashboardContent,
//         footer: Footer,
//         title: "Data3D | Document",
//         description: "Insight3d Document",
//       },
//       // ... other pages for agency
//     },
//     inmate: {
//       dashboard: {
//         topNav: TopNav,
//         sideNav: SideNav,
//         content: InmateDashboardContent,
//       },
//       // ... other pages for inmate
//     },
//   };