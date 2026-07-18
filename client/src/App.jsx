import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Reminders from './pages/Reminders';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import RawMaterials from './pages/RawMaterials';
import Inventory from './pages/Inventory';
import About from './pages/About';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — top nav + page ribbon */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices"  element={<Invoices />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/analytics"     element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings"        element={<Settings />} />
          <Route path="/raw-materials"   element={<RawMaterials />} />
          <Route path="/inventory"       element={<Inventory />} />
          <Route path="/about"           element={<About />} />
        </Route>
      </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
