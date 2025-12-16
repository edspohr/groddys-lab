import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { User, Briefcase, Phone, Mail, Building, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const { currentUser, userCompanyId } = useAuth();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('Cargando...');
  
  const [formData, setFormData] = useState({
    displayName: '',
    jobTitle: '',
    phoneNumber: '',
    email: '',
  });

  useEffect(() => {
    async function fetchProfileData() {
        if (!currentUser) return;

        try {
            // 1. Fetch User Data from Firestore (to get JobTitle, Phone)
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            let userData = {};
            if (userSnap.exists()) {
                userData = userSnap.data();
            }

            // 2. Fetch Company Name
            let fetchedCompanyName = "No asignada";
            if (userCompanyId) {
                const companyRef = doc(db, "companies", userCompanyId);
                const companySnap = await getDoc(companyRef);
                if (companySnap.exists()) {
                    fetchedCompanyName = companySnap.data().name;
                }
            }
            setCompanyName(fetchedCompanyName);

            // 3. Set Form Data
            setFormData({
                displayName: userData.displayName || currentUser.displayName || '',
                jobTitle: userData.jobTitle || '',
                phoneNumber: userData.phoneNumber || '',
                email: currentUser.email || '', // Read-only from Auth
            });

        } catch (error) {
            console.error("Error fetching profile:", error);
            addToast("Error al cargar datos del perfil", "error");
        } finally {
            setLoading(false);
        }
    }

    fetchProfileData();
  }, [currentUser, userCompanyId, addToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const userRef = doc(db, "users", currentUser.uid);
        // Only update editable fields
        await updateDoc(userRef, {
            displayName: formData.displayName,
            jobTitle: formData.jobTitle,
            phoneNumber: formData.phoneNumber
        });
        
        addToast("Perfil actualizado correctamente", "success");
    } catch (error) {
        console.error("Error updating profile:", error);
        addToast("Error al guardar cambios", "error");
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-brand-turquoise" size={40} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <header className="mb-8 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <User size={32} className="text-brand-turquoise" />
                Mi Perfil
            </h2>
            <p className="text-brand-text-secondary mt-1">
                Gestiona tu información personal y de contacto.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Avatar & Summary (Glass Card) */}
            <div className="md:col-span-1">
                <div className="glass-card rounded-2xl p-6 text-center border-white/5 relative overflow-hidden">
                    <div className="w-24 h-24 mx-auto bg-brand-dark rounded-full flex items-center justify-center mb-4 ring-2 ring-brand-turquoise ring-offset-4 ring-offset-black">
                        <span className="text-3xl font-bold text-white">
                            {formData.displayName ? formData.displayName.substring(0, 2).toUpperCase() : 'US'}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{formData.displayName || "Usuario"}</h3>
                    <p className="text-brand-turquoise text-sm font-medium mb-4">{formData.jobTitle || "Sin cargo definido"}</p>
                    
                    <div className="bg-white/5 rounded-lg p-3 text-left space-y-2 mt-6">
                        <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                            <Mail size={12} /> {formData.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                            <Building size={12} /> {companyName}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Edit Form */}
            <div className="md:col-span-2">
                <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 md:p-8 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-purple-400" />
                        Información Personal
                    </h3>

                    <div className="space-y-6">
                        {/* Read Only Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 opacity-60">
                                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Correo Electrónico (No editable)</label>
                                <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed">
                                    <Mail size={18} />
                                    <span>{formData.email}</span>
                                </div>
                            </div>
                            <div className="space-y-2 opacity-60">
                                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Empresa (No editable)</label>
                                <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed">
                                    <Building size={18} />
                                    <span>{companyName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Nombre Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-brand-text-secondary group-focus-within:text-brand-turquoise transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Cargo / Rol</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-3.5 text-brand-text-secondary group-focus-within:text-brand-turquoise transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                        placeholder="Ej. Gerente Comercial"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Teléfono</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-3.5 text-brand-text-secondary group-focus-within:text-brand-turquoise transition-colors" size={18} />
                                    <input 
                                        type="tel" 
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                        placeholder="+56 9 ..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-brand-turquoise text-brand-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-turquoise/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}
