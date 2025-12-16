import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { Building2, ChevronDown } from 'lucide-react';

export default function CompanySelector({ value, onChange, className = '' }) {
  const [companies, setCompanies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'companies'));
        const companyList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id
        }));
        setCompanies(companyList);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const selectedCompany = companies.find(c => c.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-lg hover:border-brand-turquoise/50 transition-all text-sm font-medium text-white group"
      >
        <Building2 size={16} className="text-brand-turquoise" />
        <span className="max-w-[180px] truncate">
          {loading ? 'Cargando...' : (selectedCompany?.name || 'Todas las Empresas')}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-brand-card border border-brand-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="max-h-64 overflow-y-auto">
            {/* All Companies Option */}
            <button
              onClick={() => { onChange(null); setIsOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-brand-turquoise/10 transition flex items-center gap-2 ${
                !value ? 'bg-brand-turquoise/10 text-brand-turquoise font-medium' : 'text-gray-300'
              }`}
            >
              <Building2 size={14} />
              Todas las Empresas
            </button>

            {/* Divider */}
            <div className="border-t border-brand-border my-1" />

            {/* Company List */}
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => { onChange(company.id); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-brand-turquoise/10 transition flex items-center gap-2 ${
                  value === company.id ? 'bg-brand-turquoise/10 text-brand-turquoise font-medium' : 'text-gray-300'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-brand-dark flex items-center justify-center text-xs font-bold text-white border border-brand-border">
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{company.name}</span>
              </button>
            ))}

            {companies.length === 0 && !loading && (
              <p className="px-4 py-3 text-sm text-gray-500 italic">No hay empresas registradas.</p>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
