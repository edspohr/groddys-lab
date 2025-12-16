import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LucideLayoutDashboard, LucideLogOut, LucideUserCircle, LucideGraduationCap, LucideBell, LucideUsers, LucideShield } from 'lucide-react';
import { useNavigate, Outlet, Link } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const getInitials = (user) => {
    const name = user.displayName || user.email;
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-brand-dark text-brand-text-primary">
      {/* Sidebar */}
      <aside className="w-20 bg-brand-card border-r border-brand-border flex flex-col items-center py-6 gap-6 z-30">
        <img src="/img/logo.png" alt="Logo" className="w-10 h-10" />
        
        <nav className="flex flex-col items-center gap-4 grow w-full px-2">

          <ul className="flex flex-col items-center gap-4">
            <SidebarItem icon={<LucideLayoutDashboard size={20} />} text="Dashboard" to="/" active={location.pathname === '/'} />
            <SidebarItem icon={<LucideGraduationCap size={20} />} text="Academy" to="/academy" active={location.pathname === '/academy'} />
            <SidebarItem icon={<LucideUserCircle size={20} />} text="Mi Perfil" to="/profile" active={location.pathname === '/profile'} />
            
            {(userRole === 'Superuser' || userRole === 'Admin') && (
               <div className="mt-4 pt-4 border-t border-brand-border">
                  <SidebarItem 
                      icon={<LucideShield size={20} />} 
                      text="Admin Panel" 
                      to="/admin" 
                      active={location.pathname.startsWith('/admin')} 
                  />
               </div>
            )}
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-4">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="sidebar-icon p-3 rounded-xl text-brand-text-secondary relative">
            <LucideBell size={24} />
            {/* Notification logic here */}
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white ring-2 ring-brand-turquoise cursor-pointer">
            {currentUser && getInitials(currentUser)}
          </div>



          <button onClick={handleLogout} className="sidebar-icon p-3 rounded-xl text-brand-text-secondary" title="Cerrar Sesión">
            <LucideLogOut size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
           {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, text, to, active }) {
    return (
        <li className={`group relative w-full flex justify-center`}>
            <Link to={to} className={`p-3 rounded-xl transition-all duration-200 ${active ? 'bg-brand-turquoise text-brand-dark shadow-lg shadow-brand-turquoise/20' : 'text-brand-text-secondary hover:bg-brand-card hover:text-white'}`}>
                {icon}
            </Link>
            {/* Tooltip */}
            <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-brand-card border border-brand-border text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {text}
            </span>
        </li>
    );
}
