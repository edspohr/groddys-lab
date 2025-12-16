import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Building, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { userRole } = useAuth();
  
  if (userRole !== 'Superuser' && userRole !== 'Admin') {
      return <div className="p-8 text-red-500">Acceso Denegado</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Panel de Administración</h2>
      <p className="text-brand-text-secondary mb-8">Gestión de usuarios, empresas y configuración global.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <AdminCard 
            to="/admin/companies"
            icon={<Building size={32} className="text-blue-400" />}
            title="Empresas"
            desc="Gestionar clientes y configuraciones."
        />

        <AdminCard 
            to="/admin/users"
            icon={<Users size={32} className="text-green-400" />}
            title="Usuarios"
            desc="Gestionar accesos y roles."
        />

        <AdminCard 
            to="/admin/meetings"
            icon={<FileText size={32} className="text-purple-400" />}
            title="Bitácora de Reuniones"
            desc="Registrar acuerdos y seguimientos."
        />

      </div>
    </div>
  );
}

function AdminCard({ to, icon, title, desc }) {
    return (
        <Link to={to} className="block bg-brand-card border border-brand-border p-6 rounded-lg hover:border-brand-turquoise transition group">
            <div className="mb-4 bg-brand-dark w-fit p-3 rounded-lg group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-turquoise transition-colors">{title}</h3>
            <p className="text-brand-text-secondary text-sm">{desc}</p>
        </Link>
    );
}
