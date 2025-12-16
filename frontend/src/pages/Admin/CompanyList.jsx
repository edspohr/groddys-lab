import { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Building, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "companies"), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
            <div>
                <Link to="/admin" className="text-brand-text-secondary hover:text-white text-sm mb-2 block">← Volver al Panel</Link>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Building size={32} className="text-blue-400" />
                    Empresas
                </h2>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition"
            >
                <Plus size={20} /> Nueva Empresa
            </button>
       </div>

       {loading ? <Loader2 className="animate-spin text-white mx-auto" /> : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {companies.map(company => (
                   <div key={company.id} className="bg-brand-card border border-brand-border p-6 rounded-lg hover:border-blue-400 transition">
                       <h3 className="text-xl font-bold text-white mb-2">{company.name}</h3>
                       <p className="text-brand-text-secondary text-sm mb-4">ID: {company.id}</p>
                       <div className="flex justify-between items-center text-xs text-gray-500">
                           <span>Creada: {company.createdAt?.toDate().toLocaleDateString()}</span>
                           {/* Future: Active Users count ? */}
                       </div>
                   </div>
               ))}
           </div>
       )}

       <AddCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function AddCompanyModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use name as ID (slugified) or auto-id? 
            // Better to use auto-ID for simplicity, but user often wants a semantic ID for "companyId" reference
            // Let's stick to Firestore Auto ID for now, OR let user specify if needed.
            // For tasks, we used "companies/{id}". 
            
            await addDoc(collection(db, "companies"), {
                name,
                createdAt: serverTimestamp(),
                tier: 'premium' // Default for now
            });
            onClose();
            setName('');
        } catch (e) {
            console.error(e);
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-brand-card w-full max-w-md rounded-xl border border-brand-border p-6">
                <h3 className="text-xl font-bold text-white mb-4">Nueva Empresa</h3>
                <form onSubmit={handleSubmit}>
                    <input 
                        className="w-full bg-brand-dark border border-brand-border rounded p-3 text-white mb-4 focus:outline-none focus:border-brand-turquoise"
                        placeholder="Nombre de la Empresa"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white px-3 py-2">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded font-bold">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
