import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import Navbar            from './components/Navbar';
import Home              from './pages/Home';
import Login             from './pages/Login';
import Register          from './pages/Register';
import ParentDashboard   from './pages/ParentDashboard';
import OwnerPortal       from './pages/OwnerPortal';
import DaycareProfile    from './pages/DaycareProfile';
import Compare           from './pages/Compare';
import Messages          from './pages/Messages';
import VerifyEmail       from './pages/VerifyEmail';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"            element={<Home />}            />
          <Route path="/login"       element={<Login />}           />
          <Route path="/register"    element={<Register />}        />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard"   element={<ParentDashboard />} />
          <Route path="/portal"      element={<OwnerPortal />}     />
          <Route path="/daycare/:id" element={<DaycareProfile />}  />
          <Route path="/compare"     element={<Compare />}         />
          <Route path="/messages"    element={<Messages />} />          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
