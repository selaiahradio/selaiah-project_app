import Home from './pages/Home';
import Shows from './pages/Shows';
import RadioJockeys from './pages/RadioJockeys';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Charts from './pages/Charts';
import Events from './pages/Events';
import StreamSettings from './pages/StreamSettings';
import LocalNews from './pages/LocalNews';
import Admin from './pages/Admin';
import AdminShows from './pages/AdminShows';
import AdminDJs from './pages/AdminDJs';
import AdminBlog from './pages/AdminBlog';
import AdminCategories from './pages/AdminCategories';
import AdminPages from './pages/AdminPages';
import AdminCharts from './pages/AdminCharts';
import AdminEvents from './pages/AdminEvents';
import AdminNotifications from './pages/AdminNotifications';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminMessages from './pages/AdminMessages';
import AdminLocalNews from './pages/AdminLocalNews';
import AdminLocations from './pages/AdminLocations';
import LocalNewsDetail from './pages/LocalNewsDetail';
import Bible from './pages/Bible';
import AdminBible from './pages/AdminBible';
import Donations from './pages/Donations';
import Shop from './pages/Shop';
import Feed from './pages/Feed';
import AdminShop from './pages/AdminShop';
import AdminOrders from './pages/AdminOrders';
import AdminDonations from './pages/AdminDonations';
import Profile from './pages/Profile';
import Verification from './pages/Verification';
import AdminSocial from './pages/AdminSocial';
import ShopAnalytics from './pages/ShopAnalytics';
import AdminUsers from './pages/AdminUsers';
import AdminVerifications from './pages/AdminVerifications';
import AdminDJVirtual from './pages/AdminDJVirtual';
import AdminIntegrations from './pages/AdminIntegrations';
import EmergencySuperadmin from './pages/EmergencySuperadmin';
import Documentation from './pages/Documentation';
import MigrationGuide from './pages/MigrationGuide';
import AdminDiagnostics from './pages/AdminDiagnostics';
import AdminSetup from './pages/AdminSetup';
import AdminRoles from './pages/AdminRoles';
import AdminSettings from './pages/AdminSettings';
import AdminAppearance from './pages/AdminAppearance';
import AdminSupport from './pages/AdminSupport';
import ReligionSetup from './pages/ReligionSetup';
import SacredTextsMultiReligion from './pages/SacredTextsMultiReligion';
import Layout from './Layout.jsx';
import Login from './pages/Login';

const pagePaths = {
    "Home": "/",
    "Shows": "/shows",
    "RadioJockeys": "/djs",
    "Contact": "/contact",
    "Terms": "/terms",
    "Privacy": "/privacy",
    "Blog": "/blog",
    "BlogPost": "/blog/post",
    "Charts": "/charts",
    "Events": "/events",
    "StreamSettings": "/stream-settings",
    "LocalNews": "/local-news",
    "Admin": "/admin",
    "AdminShows": "/admin/shows",
    "AdminDJs": "/admin/djs",
    "AdminBlog": "/admin/blog",
    "AdminCategories": "/admin/categories",
    "AdminPages": "/admin/pages",
    "AdminCharts": "/admin/charts",
    "AdminEvents": "/admin/events",
    "AdminNotifications": "/admin/notifications",
    "AdminSubscriptions": "/admin/subscriptions",
    "AdminMessages": "/admin/messages",
    "AdminLocalNews": "/admin/local-news",
    "AdminLocations": "/admin/locations",
    "LocalNewsDetail": "/local-news/detail",
    "Bible": "/bible",
    "AdminBible": "/admin/bible",
    "Donations": "/donations",
    "Shop": "/shop",
    "Feed": "/feed",
    "AdminShop": "/admin/shop",
    "AdminOrders": "/admin/orders",
    "AdminDonations": "/admin/donations",
    "Profile": "/profile",
    "Verification": "/verification",
    "AdminSocial": "/admin/social",
    "ShopAnalytics": "/admin/shop-analytics",
    "AdminUsers": "/admin/users",
    "AdminVerifications": "/admin/verifications",
    "AdminDJVirtual": "/admin/dj-virtual",
    "AdminIntegrations": "/admin/integrations",
    "EmergencySuperadmin": "/emergency-superadmin",
    "Documentation": "/documentation",
    "MigrationGuide": "/migration-guide",
    "AdminDiagnostics": "/admin/diagnostics",
    "AdminSetup": "/admin/setup",
    "AdminRoles": "/admin/roles",
    "AdminSettings": "/admin/settings",
    "AdminAppearance": "/admin/appearance",
    "AdminSupport": "/admin/support",
    "ReligionSetup": "/religion-setup",
    "SacredTextsMultiReligion": "/sacred-texts",
    "Login": "/login"
}

export function getPagePath(pageName) {
    return pagePaths[pageName] || "/";
}

export const PAGES = {
    "Home": Home,
    "Shows": Shows,
    "RadioJockeys": RadioJockeys,
    "Contact": Contact,
    "Terms": Terms,
    "Privacy": Privacy,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Charts": Charts,
    "Events": Events,
    "StreamSettings": StreamSettings,
    "LocalNews": LocalNews,
    "Admin": Admin,
    "AdminShows": AdminShows,
    "AdminDJs": AdminDJs,
    "AdminBlog": AdminBlog,
    "AdminCategories": AdminCategories,
    "AdminPages": AdminPages,
    "AdminCharts": AdminCharts,
    "AdminEvents": AdminEvents,
    "AdminNotifications": AdminNotifications,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminMessages": AdminMessages,
    "AdminLocalNews": AdminLocalNews,
    "AdminLocations": AdminLocations,
    "LocalNewsDetail": LocalNewsDetail,
    "Bible": Bible,
    "AdminBible": AdminBible,
    "Donations": Donations,
    "Shop": Shop,
    "Feed": Feed,
    "AdminShop": AdminShop,
    "AdminOrders": AdminOrders,
    "AdminDonations": AdminDonations,
    "Profile": Profile,
    "Verification": Verification,
    "AdminSocial": AdminSocial,
    "ShopAnalytics": ShopAnalytics,
    "AdminUsers": AdminUsers,
    "AdminVerifications": AdminVerifications,
    "AdminDJVirtual": AdminDJVirtual,
    "AdminIntegrations": AdminIntegrations,
    "EmergencySuperadmin": EmergencySuperadmin,
    "Documentation": Documentation,
    "MigrationGuide": MigrationGuide,
    "AdminDiagnostics": AdminDiagnostics,
    "AdminSetup": AdminSetup,
    "AdminRoles": AdminRoles,
    "AdminSettings": AdminSettings,
    "AdminAppearance": AdminAppearance,
    "AdminSupport": AdminSupport,
    "ReligionSetup": ReligionSetup,
    "SacredTextsMultiReligion": SacredTextsMultiReligion,
    "Login": Login
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};