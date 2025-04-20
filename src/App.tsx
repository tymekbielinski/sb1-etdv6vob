import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthTabs } from '@/components/auth/auth-tabs';
import { useAuth } from '@/components/auth/auth-provider';
import { LoadingScreen } from '@/components/loading-screen';
import { OnboardingContainer } from '@/components/onboarding/onboarding-container';

// Lazy load components
const Layout = lazy(() => import('@/components/layout'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Dashboards = lazy(() => import('@/pages/dashboards'));
const TeamSettings = lazy(() => import('@/pages/team-settings'));
const ActivityLog = lazy(() => import('@/pages/activity-log'));
const NewMetric = lazy(() => import('@/pages/metrics/new'));
const Templates = lazy(() => import('@/pages/templates'));
const TemplatePreview = lazy(() => import('@/pages/template-preview'));
const CreateTemplate = lazy(() => import('@/pages/create-template'));

// ...

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user && window.location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<AuthTabs />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OnboardingContainer>
                <Layout />
              </OnboardingContainer>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard/:id" element={<Dashboard />} />
          <Route path="dashboards" element={<Dashboards />} />
          <Route path="team" element={<TeamSettings />} />
          <Route path="activity" element={<ActivityLog />} />
          <Route path="metrics/new" element={<NewMetric />} />
          <Route path="metrics/:id" element={<NewMetric />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/preview/:id" element={<TemplatePreview />} />
          <Route path="templates/create" element={<CreateTemplate />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App