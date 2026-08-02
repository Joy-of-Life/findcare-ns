import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar           from './components/Navbar';
import Home             from './pages/Home';
import Login            from './pages/Login';
import Register         from './pages/Register';
import ParentDashboard  from './pages/ParentDashboard';
import OwnerPortal      from './pages/OwnerPortal';
import DaycareProfile   from './pages/DaycareProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/dashboard" element={<ParentDashboard />} />
          <Route path="/portal"    element={<OwnerPortal />} />
          <Route path="/daycare/:id" element={<DaycareProfile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}