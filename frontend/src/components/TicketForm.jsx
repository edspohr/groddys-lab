import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Send, Loader2 } from 'lucide-react';

export default function TicketForm({ isOpen, onClose, onSuccess, companyIdOverride }) {
  const { currentUser, userCompanyId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'question',
    priority: 'medium',
  });

  if (!isOpen) return null;

  // Use override if provided (from superuser filter), else user's own company
  const effectiveCompanyId = companyIdOverride !== undefined ? companyIdOverride : userCompanyId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine collection path
      const collectionPath = effectiveCompanyId
        ? `companies/${effectiveCompanyId}/tasks`
        : `users/${currentUser.uid}/tasks`;

      const docRef = await addDoc(collection(db, collectionPath), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        columnId: 'todo',
        status: 'new',
        type: 'ticket',
        requestorId: currentUser.uid,
        requestorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        assignedTo: null,
        estimatedHours: 0,
        companyId: effectiveCompanyId || null
      });

      // Add initial 'created' activity log entry
      await addDoc(collection(db, `${collectionPath}/${docRef.id}/activityLog`), {
        type: 'created',
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        details: {}
      });

      setFormData({ title: '', description: '', category: 'question', priority: 'medium' });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Error al crear la solicitud. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-brand-border bg-brand-dark">
          <h3 className="text-xl font-bold text-white">Nueva Solicitud</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Título</label>
            <input 
              type="text" 
              required
              placeholder="Ej: Problema con el reporte de ventas..." 
              className="w-full bg-[#050505] border border-gray-800 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-brand-turquoise transition text-sm text-white placeholder-gray-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Tipo</label>
              <select 
                className="w-full bg-[#050505] border border-gray-800 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-brand-turquoise transition text-sm text-white appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="question">❓ Consulta</option>
                <option value="bug">🐛 Reportar Error</option>
                <option value="feature">✨ Nueva Funcionalidad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Prioridad (Tu visión)</label>
              <select 
                className="w-full bg-[#050505] border border-gray-800 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-brand-turquoise transition text-sm text-white appearance-none"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">☁️ Baja</option>
                <option value="medium">⚡ Media</option>
                <option value="high">🔥 Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Descripción Detallada</label>
            <textarea 
              required
              rows="4"
              placeholder="Describe lo que necesitas con el mayor detalle posible..."
              className="w-full bg-[#050505] border border-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-turquoise transition text-sm text-white placeholder-gray-500 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-turquoise text-brand-dark font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar Solicitud</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
