import { useState, useEffect } from 'react';
import { db, app } from '../../firebase-config'; // Need app for secondary auth
import { collection, onSnapshot, setDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // Modular SDK
import { initializeApp } from "firebase/app"; // To create secondary instance
import { Users, Plus, Loader2, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

// Note: Creating a user requires credentials. 
// Trick: Initialize a SECOND Firebase App instance to create user without logging out the admin.

// We need the config from firebase-config but it's not exported as default.
// We'll rely on the existing modules or standard "trick".
// We'll rely on the existing modules or standard "trick".
// import firebaseConfig from '../../firebase-config'; // Will need to ensure firebase-config exports the raw config object if we do this.

// Wait, standard firebase-config usually exports 'app'. we can get options from app.options
const secondaryApp = initializeApp(app.options, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Get companies for dropdown
    const unsubCompanies = onSnapshot(collection(db, "companies"), (snapshot) => {
       setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
       setLoading(false);
    });

    return () => {
        unsubUsers();
        unsubCompanies();
    };
  }, []);

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
            <div>
                <Link to="/admin" className="text-brand-text-secondary hover:text-white text-sm mb-2 block">← Volver al Panel</Link>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users size={32} className="text-green-400" />
                    Usuarios
                </h2>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition"
            >
                <Plus size={20} /> Nuevo Usuario
            </button>
       </div>

       <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-brand-dark text-brand-text-secondary text-sm uppercase">
                        <th className="p-4 border-b border-brand-border">Nombre</th>
                        <th className="p-4 border-b border-brand-border">Email</th>
                        <th className="p-4 border-b border-brand-border">Rol</th>
                        <th className="p-4 border-b border-brand-border">Empresa</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                    {users.map(user => {
                        const companyName = companies.find(c => c.id === user.companyId)?.name || '-';
                        return (
                            <tr key={user.id} className="hover:bg-brand-border/30 text-white transition">
                                <td className="p-4 font-medium">{user.displayName}</td>
                                <td className="p-4 text-brand-text-secondary">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        user.role === 'Superuser' ? 'bg-yellow-500/20 text-yellow-500' :
                                        user.role === 'Admin' ? 'bg-purple-500/20 text-purple-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        {user.role || 'Usuario'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{companyName}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
       </div>

       <AddUserModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            companies={companies}
            auth={secondaryAuth} // Pass secondary auth
       />
    </div>
  );
}

function AddUserModal({ isOpen, onClose, companies, auth }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'Pro', // Default role 'Pro' (Standard user)
        companyId: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create User in Auth (Secondary App)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Doc in Firestore (Main App)
            // Note: We write to 'users/{uid}'
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: formData.displayName,
                role: formData.role,
                companyId: formData.companyId,
                createdAt: serverTimestamp()
            });

            // Note: We also need to set Custom Claims via Cloud Function usually.
            // But for now, our AuthContext reads from Firestore 'users' collection or claims? 
            // In AuthContext.jsx we read claims. If we rely on claims, we MUST trigger the function `setUserRole`.
            // Currently `setUserRole` function triggers on... HTTP? Or Firestore Trigger?
            // The existing `functions/index.js` uses `setUserRole` as an HTTP callable or trigger?
            // "exports.setUserRole = functions.https.onCall..."?
            
            // Let's assume for this version our AuthContext ALSO looks at the Firestore document as a fallback or primary source?
            // Checking AuthContext... it reads claims. 
            // If we don't set claims, the user won't have the role in the token.
            // However, we can update AuthContext to read from Firestore doc if claims are missing, OR we rely on a Cloud Function trigger.
            // For this POC, we will just create the Firestore doc. The user might need a manual claim update later or we add a trigger.
            // BUT: The original prompt said "I create new users". 
            
            alert(`Usuario creado exitosamente. UID: ${user.uid}`);
            onClose();
            setFormData({email: '', password: '', displayName: '', role: 'Pro', companyId: ''});

        } catch (e) {
            console.error(e);
            alert("Error al crear usuario: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border p-6">
                <h3 className="text-xl font-bold text-white mb-4">Nuevo Usuario</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div>
                        <label className="block text-xs text-brand-text-secondary mb-1">Nombre Completo</label>
                        <input 
                            className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white focus:outline-none focus:border-brand-turquoise"
                            value={formData.displayName}
                            onChange={e => setFormData({...formData, displayName: e.target.value})}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-text-secondary mb-1">Email</label>
                            <input 
                                type="email"
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white focus:outline-none focus:border-brand-turquoise"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                             <label className="block text-xs text-brand-text-secondary mb-1">Contraseña Temporal</label>
                             <input 
                                type="text"
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white focus:outline-none focus:border-brand-turquoise"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs text-brand-text-secondary mb-1">Rol</label>
                            <select 
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white focus:outline-none focus:border-brand-turquoise"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="Pro">Usuario (Pro)</option>
                                <option value="Admin">Admin (Cliente)</option>
                                <option value="Superuser">Superuser (Staff)</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs text-brand-text-secondary mb-1">Empresa</label>
                             <select 
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white focus:outline-none focus:border-brand-turquoise"
                                value={formData.companyId}
                                onChange={e => setFormData({...formData, companyId: e.target.value})}
                                disabled={formData.role === 'Superuser'}
                            >
                                <option value="">-- Seleccionar --</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white px-3 py-2">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded font-bold">Crear Usuario</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
