import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, collectionGroup } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Plus, Calendar, Users, Building2, ChevronDown, X, Save, Loader2 } from 'lucide-react';
import CompanySelector from '../components/CompanySelector';

export default function Bitacora() {
  const { currentUser, userRole, userCompanyId } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Company filter (superadmin only)
  const isSuperuser = userRole === 'Superuser' || userRole === 'Admin';
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  // For superadmins: fetch company names for display
  const [companies, setCompanies] = useState({});

  // Fetch companies for name lookup
  useEffect(() => {
    if (!isSuperuser) return;
    
    const fetchCompanies = async () => {
      const snapshot = await getDocs(collection(db, 'companies'));
      const companyMap = {};
      snapshot.docs.forEach(doc => {
        companyMap[doc.id] = doc.data().name || doc.id;
      });
      setCompanies(companyMap);
    };
    fetchCompanies();
  }, [isSuperuser]);

  // Subscribe to meetings
  useEffect(() => {
    if (!currentUser) return;

    // Determine which meetings to fetch
    let meetingsRef;
    
    if (isSuperuser && !selectedCompanyId) {
      // Superuser viewing ALL - use collectionGroup
      meetingsRef = query(
        collectionGroup(db, 'meetings'),
        orderBy('date', 'desc')
      );
    } else {
      // Specific company
      const companyId = selectedCompanyId || userCompanyId;
      if (!companyId) {
        setTimeout(() => {
            if (meetings.length > 0) setMeetings([]);
            if (loading) setLoading(false);
        }, 0);
        return;
      }
      meetingsRef = query(
        collection(db, 'companies', companyId, 'meetings'),
        orderBy('date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(meetingsRef, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeetings(meetingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching meetings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isSuperuser, selectedCompanyId, userCompanyId]);

  return (
    <div>
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 text-transparent bg-clip-text flex items-center gap-3">
            <BookOpen className="text-brand-turquoise" /> Bitácora
          </h2>
          <p className="text-brand-text-secondary mt-1">
            Registro de reuniones y acuerdos con clientes.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {isSuperuser && (
            <CompanySelector 
              value={selectedCompanyId} 
              onChange={setSelectedCompanyId} 
            />
          )}
          {isSuperuser && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-transform active:scale-95"
            >
              <Plus size={20} /> Nueva Minuta
            </button>
          )}
        </div>
      </header>

      {/* Meetings Timeline */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-turquoise" size={32} />
          </div>
        ) : meetings.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay minutas registradas</h3>
            <p className="text-gray-500">
              {isSuperuser 
                ? "Crea una nueva minuta para comenzar a registrar reuniones."
                : "Las minutas de reuniones aparecerán aquí."
              }
            </p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting} 
              companyName={isSuperuser ? companies[meeting.companyId] : null}
              showCompany={isSuperuser && !selectedCompanyId}
            />
          ))
        )}
      </div>

      {/* New Meeting Form Modal */}
      {isFormOpen && (
        <MeetingFormModal 
          onClose={() => setIsFormOpen(false)}
          selectedCompanyId={selectedCompanyId}
        />
      )}
    </div>
  );
}

// Meeting Card Component
function MeetingCard({ meeting, companyName, showCompany }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDate = meeting.date?.seconds 
    ? format(new Date(meeting.date.seconds * 1000), "EEEE, d 'de' MMMM yyyy", { locale: es })
    : 'Fecha no disponible';

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-brand-border hover:border-brand-turquoise/30 transition-all">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-turquoise/10 flex items-center justify-center">
                <Calendar size={20} className="text-brand-turquoise" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{meeting.title}</h3>
                <p className="text-sm text-gray-400 capitalize">{formattedDate}</p>
              </div>
            </div>
            
            {showCompany && companyName && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Building2 size={14} className="text-purple-400" />
                <span className="text-purple-300 font-medium">{companyName}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} />
            <span>{meeting.attendees?.length || 0}</span>
            <ChevronDown 
              size={20} 
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-6 pt-0 border-t border-brand-border bg-brand-dark/30 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Asistentes</h4>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees?.map((attendee, i) => (
                  <span key={i} className="bg-brand-card px-3 py-1 rounded-full text-sm text-white border border-brand-border">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Acuerdos</h4>
              <ul className="space-y-2">
                {meeting.agreements?.map((agreement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-brand-turquoise mt-0.5">•</span>
                    {agreement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {meeting.notes && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Meeting Form Modal
function MeetingFormModal({ onClose, selectedCompanyId }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    attendees: '',
    agreements: '',
    notes: '',
    companyId: selectedCompanyId || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId) {
      alert("Selecciona una empresa.");
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'companies', formData.companyId, 'meetings'), {
        title: formData.title,
        date: new Date(formData.date),
        attendees: formData.attendees.split(',').map(a => a.trim()).filter(Boolean),
        agreements: formData.agreements.split('\n').map(a => a.trim()).filter(Boolean),
        notes: formData.notes,
        companyId: formData.companyId,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Error al crear la minuta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-brand-border bg-brand-dark">
          <h3 className="text-xl font-bold text-white">Nueva Minuta de Reunión</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Empresa</label>
            <CompanySelector 
              value={formData.companyId} 
              onChange={(v) => setFormData({...formData, companyId: v || ''})}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
              <input 
                type="text"
                required
                placeholder="Ej: Revisión Sprint 3"
                className="w-full bg-[#050505] border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
              <input 
                type="date"
                required
                className="w-full bg-[#050505] border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Asistentes (separados por coma)</label>
            <input 
              type="text"
              placeholder="Juan Pérez, María García, ..."
              className="w-full bg-[#050505] border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
              value={formData.attendees}
              onChange={(e) => setFormData({...formData, attendees: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Acuerdos (uno por línea)</label>
            <textarea 
              rows="4"
              placeholder="Implementar feature X para el viernes&#10;Revisar diseño con cliente&#10;..."
              className="w-full bg-[#050505] border border-gray-700 rounded-lg py-2 px-3 text-white text-sm resize-none"
              value={formData.agreements}
              onChange={(e) => setFormData({...formData, agreements: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Notas adicionales</label>
            <textarea 
              rows="2"
              className="w-full bg-[#050505] border border-gray-700 rounded-lg py-2 px-3 text-white text-sm resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-turquoise text-brand-dark font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Guardar Minuta</>}
          </button>
        </form>
      </div>
    </div>
  );
}
