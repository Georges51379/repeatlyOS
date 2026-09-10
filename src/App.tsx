import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AccountSecurity from './pages/auth/AccountSecurity';
import RequireAuth from './components/RequireAuth';
import Onboarding from './pages/onboarding/Onboarding';
import AppHome from './pages/app/AppHome';
import BusinessLayout from './components/BusinessLayout';
import RealProducts from './pages/business/Products';
import RealInventory from './pages/business/Inventory';
import RealOrders from './pages/business/Orders';
import RealCustomers from './pages/business/Customers';
import RealTasks from './pages/business/Tasks';
import BusinessServices from './pages/business/Services';
import BusinessBookings from './pages/business/Bookings';
import BusinessAnalytics from './pages/business/Analytics';
import BusinessPayments from './pages/business/Payments';
import BusinessMemberships from './pages/business/Memberships';
import BusinessSettings from './pages/business/BusinessSettings';
import { MarketplaceCartProvider } from './context/MarketplaceCartContext';
import MarketplaceLayout from './components/MarketplaceLayout';
import CityHome from './pages/marketplace/CityHome';
import MarketplaceSearch from './pages/marketplace/Search';
import BusinessStorefront from './pages/marketplace/BusinessStorefront';
import ProductDetail from './pages/marketplace/ProductDetail';
import ServiceDetail from './pages/marketplace/ServiceDetail';
import MarketplaceCart from './pages/marketplace/Cart';
import LandingPage from './pages/LandingPage';
import BusinessPublicPage from './pages/BusinessPublicPage';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import CalendarPage from './pages/dashboard/Calendar';
import Bookings from './pages/dashboard/Bookings';
import Customers from './pages/dashboard/Customers';
import Products from './pages/dashboard/Products';
import Inventory from './pages/dashboard/Inventory';
import Packages from './pages/dashboard/Packages';
import Subscriptions from './pages/dashboard/Subscriptions';
import Payments from './pages/dashboard/Payments';
import Invoices from './pages/dashboard/Invoices';
import Tasks from './pages/dashboard/Tasks';
import Staff from './pages/dashboard/Staff';
import Reminders from './pages/dashboard/Reminders';
import Loyalty from './pages/dashboard/Loyalty';
import Reports from './pages/dashboard/Reports';
import ActivityLog from './pages/dashboard/ActivityLog';
import MultiBranch from './pages/dashboard/MultiBranch';
import Settings from './pages/dashboard/Settings';
import Broadcast from './pages/dashboard/Broadcast';
import Forecast from './pages/dashboard/Forecast';
import Commissions from './pages/dashboard/Commissions';
import Expenses from './pages/dashboard/Expenses';
import Occasions from './pages/dashboard/Occasions';
import Waitlist from './pages/dashboard/Waitlist';
import Reorder from './pages/dashboard/Reorder';
import HealthScore from './pages/dashboard/HealthScore';
import Heatmap from './pages/dashboard/Heatmap';
import Goals from './pages/dashboard/Goals';
import Referrals from './pages/dashboard/Referrals';
import TeamRoles from './pages/dashboard/TeamRoles';
import RecurringBookings from './pages/dashboard/RecurringBookings';
import Scheduler from './pages/dashboard/Scheduler';
import NoShows from './pages/dashboard/NoShows';
import PartialPayments from './pages/dashboard/PartialPayments';
import Enterprise from './pages/dashboard/Enterprise';
import DemoSetup from './pages/demo/DemoSetup';
import PitchPage from './pages/demo/PitchPage';
import CustomerPortal from './pages/customer/CustomerPortal';

export default function App() {
  return (
    <AuthProvider>
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/account/security"
            element={
              <RequireAuth>
                <AccountSecurity />
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <Onboarding />
              </RequireAuth>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppHome />
              </RequireAuth>
            }
          />
          <Route
            path="/app/:businessId"
            element={
              <RequireAuth>
                <BusinessLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="customers" replace />} />
            <Route path="products" element={<RealProducts />} />
            <Route path="inventory" element={<RealInventory />} />
            <Route path="orders" element={<RealOrders />} />
            <Route path="customers" element={<RealCustomers />} />
            <Route path="services" element={<BusinessServices />} />
            <Route path="bookings" element={<BusinessBookings />} />
            <Route path="tasks" element={<RealTasks />} />
            <Route path="analytics" element={<BusinessAnalytics />} />
            <Route path="payments" element={<BusinessPayments />} />
            <Route path="memberships" element={<BusinessMemberships />} />
            <Route path="settings" element={<BusinessSettings />} />
          </Route>
          <Route path="/business/elite-carwash" element={<BusinessPublicPage />} />
          <Route path="/demo/setup" element={<DemoSetup />} />
          <Route path="/demo/pitch" element={<PitchPage />} />
          <Route path="/customer/portal" element={<CustomerPortal />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="packages" element={<Packages />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="payments" element={<Payments />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="reports" element={<Reports />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="branches" element={<MultiBranch />} />
            <Route path="settings" element={<Settings />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="occasions" element={<Occasions />} />
            <Route path="waitlist" element={<Waitlist />} />
            <Route path="reorder" element={<Reorder />} />
            <Route path="health" element={<HealthScore />} />
            <Route path="heatmap" element={<Heatmap />} />
            <Route path="goals" element={<Goals />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="team" element={<TeamRoles />} />
            <Route path="recurring" element={<RecurringBookings />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="noshows" element={<NoShows />} />
            <Route path="partial-payments" element={<PartialPayments />} />
            <Route path="enterprise" element={<Enterprise />} />
          </Route>

          {/* Phase 6 — public city marketplace. Deliberately its own layout
              (MarketplaceLayout), no auth required — see master-prompt §32. */}
          <Route
            path="/:citySlug"
            element={
              <MarketplaceCartProvider>
                <MarketplaceLayout />
              </MarketplaceCartProvider>
            }
          >
            <Route index element={<CityHome />} />
            <Route path="search" element={<MarketplaceSearch />} />
            <Route path="cart" element={<MarketplaceCart />} />
            <Route path="business/:businessSlug" element={<BusinessStorefront />} />
            <Route path="business/:businessSlug/product/:productId" element={<ProductDetail />} />
            <Route path="business/:businessSlug/service/:serviceId" element={<ServiceDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DemoProvider>
    </AuthProvider>
  );
}
