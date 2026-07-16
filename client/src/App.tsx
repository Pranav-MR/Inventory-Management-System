import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './routes/LoginPage';
import { SignupPage } from './routes/SignupPage';
import { DashboardPage } from './routes/DashboardPage';
import { ItemsPage } from './routes/ItemsPage';
import { ItemDetailPage } from './routes/ItemDetailPage';
import { NotificationSettingsPage } from './routes/NotificationSettingsPage';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/:itemId" element={<ItemDetailPage />} />
          <Route path="/notifications" element={<NotificationSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
