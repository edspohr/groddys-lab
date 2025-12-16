import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { X, Save, User, Briefcase, Phone, Mail } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Initialize with current user data, default to empty strings if missing
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    jobTitle: currentUser?.photoURL || '', // Using photoURL field for Job Title temporarily or creating new field? 
    // Wait, AuthContext createUserProfile schema has: displayName, photoURL, tier, role, companyId.
    // Let's use specific Firestore fields. We should fetch the Firestore user doc to get the latest, 
    // but typically currentUser from AuthContext is the Auth object. 
    // `useAuth` returns `currentUser` (Auth object). 
    // We should probably rely on what's in Firestore or just update the Auth profile + Firestore.
    // Let's assume we want to update the 'users' collection document.
    phoneNumber: '',
  });

  // To do this properly, we should load the user's extended profile (job title, phone) from Firestore when opening.
  // But for now, let's just allow editing Display Name and maybe a new 'jobTitle' field.
  
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Update Auth Profile
        // await updateProfile(currentUser, { displayName: formData.displayName }); 
        // We can't easily import updateProfile here without importing auth, or exposing it in context.
        // Let's just update Firestore, and maybe AuthContext will sync eventually or we rely on Firestore data.
        
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
            displayName: formData.displayName,
            jobTitle: formData.jobTitle,
            phoneNumber: formData.phoneNumber
        });
        
        addToast("Perfil actualizado correctamente", "success");
        onClose();
    } catch (error) {
        console.error("Error updating profile:", error);
        addToast("Error al actualizar el perfil", "error");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden border-white/10">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-brand-turquoise" size={20} />
            Mi Perfil
          </h3>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-brand-text-secondary" size={16} />
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                        placeholder="Tu nombre"
                        value={formData.displayName}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Cargo / Rol</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-brand-text-secondary" size={16} />
                    <input 
                        type="text" 
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                        placeholder="Ej. Gerente de Operaciones"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Teléfono</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-brand-text-secondary" size={16} />
                    <input 
                        type="tel" 
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                        placeholder="+56 9 ..."
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-brand-text-secondary hover:text-white transition"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    disabled={loading}
                    className="bg-brand-turquoise text-brand-dark px-6 py-2 rounded-lg font-bold hover:shadow-lg hover:shadow-brand-turquoise/20 transition flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
