import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { X, Save, Trash2, Clock, AlertTriangle } from 'lucide-react';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { userRole, currentUser } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
        setFormData({ ...task });
        setIsEditing(false);
    }
  }, [task]);

  if (!isOpen || !task || !formData) return null;

  const isAdmin = userRole === 'Superuser' || userRole === 'Admin';

  const handleSave = async () => {
    setLoading(true);
    try {
        const collectionPath = (task.companyId)
            ? `companies/${task.companyId}/tasks`
            : `users/${currentUser.uid}/tasks`;
        
        await updateDoc(doc(db, collectionPath, task.id), {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: formData.status || 'todo',
            estimatedHours: formData.estimatedHours || 0,
            actualHours: formData.actualHours || 0,
        });
        onClose();
    } catch (error) {
        console.error("Error updating task:", error);
        alert("Error al actualizar la tarea.");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
    if(!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    
    setLoading(true);
    try {
         const collectionPath = (task.companyId)
            ? `companies/${task.companyId}/tasks`
            : `users/${currentUser.uid}/tasks`;
        
        await deleteDoc(doc(db, collectionPath, task.id));
        onClose();
    } catch (error) {
        console.error("Error deleting task:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-card w-full max-w-2xl rounded-xl border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-brand-border bg-brand-dark/50">
           {isAdmin && isEditing ? (
               <input 
                 className="bg-transparent border-b border-brand-border text-xl font-bold text-white focus:outline-none w-full mr-4"
                 value={formData.title}
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
               />
           ) : (
                <h3 className="text-xl font-bold text-white mr-4">{formData.title}</h3>
           )}
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Metadata Bar */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
                    <span className="text-brand-text-secondary">Estado:</span>
                    <span className="text-white font-medium uppercase">{formData.columnId}</span>
                </div>
                <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
                    <span className="text-brand-text-secondary">Prioridad:</span>
                    {isAdmin && isEditing ? (
                        <select 
                            className="bg-transparent text-white focus:outline-none cursor-pointer"
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                        </select>
                    ) : (
                        <span className={`font-medium uppercase ${
                            formData.priority === 'high' ? 'text-red-400' : 
                            formData.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>{formData.priority}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
                     <span className="text-brand-text-secondary">Tipo:</span>
                     <span className="text-white">{formData.category || 'Tarea'}</span>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Descripción</label>
                {isAdmin && isEditing ? (
                    <textarea 
                        rows="6"
                        className="w-full bg-brand-dark border border-brand-border rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                ) : (
                    <div className="bg-brand-dark/50 border border-brand-border rounded-lg p-4 text-gray-300 min-h-[100px] whitespace-pre-wrap">
                        {formData.description}
                    </div>
                )}
            </div>

            {/* Admin Only Fields */}
            {isAdmin && (
                <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="text-yellow-500 font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} /> Panel de Control (Admin)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-text-secondary mb-1">Horas Estimadas</label>
                            <input 
                                type="number" 
                                className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm"
                                value={formData.estimatedHours || 0}
                                onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value)})}
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-text-secondary mb-1">Horas Reales</label>
                            <input 
                                type="number" 
                                className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm"
                                value={formData.actualHours || 0}
                                onChange={(e) => setFormData({...formData, actualHours: parseFloat(e.target.value)})}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border bg-brand-dark/50 flex justify-between items-center">
             {isAdmin ? (
                 <>
                    <button 
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm"
                    >
                        <Trash2 size={16} /> Eliminar
                    </button>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-brand-text-secondary hover:text-white transition"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold hover:opacity-90 transition flex items-center gap-2"
                                >
                                    <Save size={16} /> Guardar Cambios
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-brand-card border border-brand-border text-white px-4 py-2 rounded-lg hover:border-brand-turquoise transition"
                            >
                                Editar Tarea
                            </button>
                        )}
                    </div>
                 </>
             ) : (
                 <p className="text-xs text-brand-text-secondary">Contacta a tu CTO para modificar estos detalles.</p>
             )}
        </div>
      </div>
    </div>
  );
}
