import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Plus, Calendar, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Meetings() {
  const { userRole, userCompanyId } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [companies, setCompanies] = useState([]); // For Admin filter
  const [selectedCompanyId, setSelectedCompanyId] = useState(userCompanyId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSuperuser = userRole === 'Superuser';

  useEffect(() => {
    // If Superuser, fetch companies
    if (isSuperuser) {
        const unsub = onSnapshot(collection(db, "companies"), (snap) => {
            setCompanies(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }
  }, [isSuperuser]);

  useEffect(() => {
    const targetCompanyId = isSuperuser ? selectedCompanyId : userCompanyId;

    if (!targetCompanyId && isSuperuser) {
        setTimeout(() => {
            if (meetings.length > 0) setMeetings([]); 
            if (loading) setLoading(false);
        }, 0);
        return;
    }

    if (targetCompanyId) {
        const q = query(
            collection(db, `companies/${targetCompanyId}/meetings`), 
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching meetings:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, userCompanyId, isSuperuser]);

  return (
    <div>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                {isSuperuser && <Link to="/admin" className="text-brand-text-secondary hover:text-white text-sm mb-2 block">← Volver al Panel</Link>}
                
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileText size={32} className="text-purple-400" />
                    Bitácora de Reuniones
                </h2>
                <p className="text-brand-text-secondary mt-1">Acuerdos clave y seguimiento.</p>
            </div>
            
            <div className="flex items-center gap-3">
                {isSuperuser && (
                    <select 
                        className="bg-brand-dark border border-brand-border rounded-lg p-2 text-white text-sm"
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                    >
                        <option value="">-- Seleccionar Empresa --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                {isSuperuser && selectedCompanyId && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition"
                    >
                        <Plus size={20} /> Nueva Minuta
                    </button>
                )}
            </div>
       </div>

       {loading ? <Loader2 className="animate-spin text-white mx-auto" /> : (
        <div className="space-y-6 relative border-l-2 border-brand-border ml-4 md:ml-8 pl-8 md:pl-10 pb-10">
            {meetings.length === 0 && <p className="text-gray-500">No hay reuniones registradas.</p>}
            
            {meetings.map(meeting => (
                <div key={meeting.id} className="relative mb-10 last:mb-0">
                    {/* Timestamp Dot */}
                    <div className="absolute -left-[45px] top-0 bg-brand-dark border-4 border-brand-turquoise w-5 h-5 rounded-full z-10"></div>
                    
                    <div className="bg-brand-card border border-brand-border rounded-lg p-6 hover:border-purple-400 transition group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-brand-border pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                    {meeting.title || "Reunión de Seguimiento"}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {meeting.date?.toDate().toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Users size={14} /> {meeting.attendees?.join(', ')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Acuerdos & Notas</h4>
                            <div className="whitespace-pre-wrap text-brand-text-primary bg-brand-dark/30 p-4 rounded-lg border border-brand-border/50">
                                {meeting.agreements}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
       )}

       {isSuperuser && (
           <AddMeetingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                companyId={selectedCompanyId}
           />
       )}
    </div>
  );
}

function AddMeetingModal({ isOpen, onClose, companyId }) {
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        attendees: '',
        agreements: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, `companies/${companyId}/meetings`), {
                title: formData.title,
                date: new Date(formData.date), // Should be timestamp
                attendees: formData.attendees.split(',').map(s => s.trim()),
                agreements: formData.agreements,
                createdAt: serverTimestamp()
            });
            onClose();
            setFormData({ title: '', date: new Date().toISOString().split('T')[0], attendees: '', agreements: '' });
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
            <div className="bg-brand-card w-full max-w-2xl rounded-xl border border-brand-border p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">Nueva Minuta</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs text-brand-text-secondary mb-1">Título</label>
                             <input 
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="Reunión Semanal"
                                required
                            />
                        </div>
                         <div>
                             <label className="block text-xs text-brand-text-secondary mb-1">Fecha</label>
                             <input 
                                type="date"
                                className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-brand-text-secondary mb-1">Asistentes (separados por coma)</label>
                        <input 
                             className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white"
                             value={formData.attendees}
                             onChange={e => setFormData({...formData, attendees: e.target.value})}
                             placeholder="Juan, Maria, Pedro..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-brand-text-secondary mb-1">Acuerdos y Temas</label>
                        <textarea 
                             rows="10"
                             className="w-full bg-brand-dark border border-brand-border rounded p-2 text-white font-mono text-sm"
                             value={formData.agreements}
                             onChange={e => setFormData({...formData, agreements: e.target.value})}
                             placeholder="- Tema 1: ...&#10;- Acuerdo: ..."
                             required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-white px-3 py-2">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded font-bold">Guardar Minuta</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
