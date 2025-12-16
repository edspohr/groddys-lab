import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { X, Save, Trash2, Clock, AlertTriangle, Send, MessageSquare, Circle, ArrowRight, Edit3, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { userRole, currentUser } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Activity Log State (Unified: comments + lifecycle events)
  const [activityLog, setActivityLog] = useState([]);
  const [newComment, setNewComment] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    if (task) {
        setFormData({ ...task });
        setIsEditing(false);
        setActivityLog([]);
    }
  }, [task]);

  // Subscribe to Activity Log
  useEffect(() => {
    if (!task || !isOpen) return;

    // Determine base path for this task
    const basePath = task.companyId
        ? `companies/${task.companyId}/tasks/${task.id}`
        : `users/${task.requestorId || currentUser.uid}/tasks/${task.id}`;

    console.log("[ActivityLog] Subscribing to:", `${basePath}/activityLog`);
    console.log("[ActivityLog] Task data:", { id: task.id, companyId: task.companyId, requestorId: task.requestorId });

    const q = query(collection(db, `${basePath}/activityLog`), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setActivityLog(entries);
    }, (error) => {
        console.error("Error fetching activity log:", error);
    });

    return () => unsubscribe();
  }, [task, isOpen, currentUser]);

  // Scroll to bottom of log
  useEffect(() => {
      if(logEndRef.current) {
          logEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [activityLog]);


  if (!isOpen || !task || !formData) return null;

  const isAdmin = userRole === 'Superuser' || userRole === 'Admin';

  // Helper: Get base path for Firestore operations
  const getBasePath = () => {
    return task.companyId
        ? `companies/${task.companyId}/tasks`
        : `users/${task.requestorId || currentUser.uid}/tasks`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const collectionPath = getBasePath();
        
        await updateDoc(doc(db, collectionPath, task.id), {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: formData.status || 'todo',
            estimatedHours: formData.estimatedHours || 0,
            actualHours: formData.actualHours || 0,
        });

        // Add activity log entry for edit
        await addDoc(collection(db, `${collectionPath}/${task.id}/activityLog`), {
            type: 'edit',
            timestamp: serverTimestamp(),
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email,
            details: { message: 'Actualizó los detalles de la tarea' }
        });

        setIsEditing(false);
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
        const collectionPath = getBasePath();
        await deleteDoc(doc(db, collectionPath, task.id));
        onClose();
    } catch (error) {
        console.error("Error deleting task:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
      e.preventDefault();
      if(!newComment.trim()) return;

      try {
          const basePath = getBasePath();
          
          await addDoc(collection(db, `${basePath}/${task.id}/activityLog`), {
              type: 'comment',
              timestamp: serverTimestamp(),
              userId: currentUser.uid,
              userName: currentUser.displayName || currentUser.email,
              details: { text: newComment }
          });
          setNewComment('');
      } catch (error) {
          console.error("Error sending comment:", error);
      }
  };

  // Activity Log UI Helpers
  const getActivityIcon = (type) => {
    switch (type) {
      case 'created': return <PlusCircle size={14} className="text-green-400" />;
      case 'status_change': return <ArrowRight size={14} className="text-blue-400" />;
      case 'comment': return <MessageSquare size={14} className="text-cyan-400" />;
      case 'edit': return <Edit3 size={14} className="text-yellow-400" />;
      default: return <Circle size={14} className="text-gray-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'created': return 'border-green-500/50';
      case 'status_change': return 'border-blue-500/50';
      case 'comment': return 'border-cyan-500/50';
      case 'edit': return 'border-yellow-500/50';
      default: return 'border-gray-500/50';
    }
  };

  const formatActivityMessage = (entry) => {
    switch (entry.type) {
      case 'created':
        return <span className="text-green-300">Creó esta tarea</span>;
      case 'status_change':
        return (
          <span className="text-blue-300">
            Cambió estado de <span className="font-semibold uppercase">{entry.details?.from || '?'}</span> a <span className="font-semibold uppercase">{entry.details?.to || '?'}</span>
          </span>
        );
      case 'comment':
        return <span className="text-gray-200">{entry.details?.text}</span>;
      case 'edit':
        return <span className="text-yellow-300">{entry.details?.message || 'Editó la tarea'}</span>;
      default:
        return <span className="text-gray-400">Acción desconocida</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-white/10">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 bg-black/40 shrink-0">
           {isAdmin && isEditing ? (
               <input 
                 className="bg-transparent border-b border-brand-border text-xl font-bold text-white focus:outline-none w-full mr-4"
                 value={formData.title}
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
               />
           ) : (
                <h3 className="text-xl font-bold text-white mr-4">{formData.title}</h3>
           )}
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Content Layout: 2 Columns on large screens */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Column: Task Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-brand-border">
                 {/* Metadata Bar */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
                        <span className="text-gray-400">Estado:</span>
                        <span className="text-white font-medium uppercase">{formData.columnId}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-dark px-3 py-1.5 rounded-lg border border-brand-border">
                        <span className="text-gray-400">Prioridad:</span>
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
                        <span className="text-gray-400">Tipo:</span>
                        <span className="text-white">{formData.category || 'Tarea'}</span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
                    {isAdmin && isEditing ? (
                        <textarea 
                            rows="6"
                            className="w-full bg-[#050505] border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-turquoise"
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
                                <label className="block text-xs text-gray-400 mb-1">Horas Estimadas</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm"
                                    value={formData.estimatedHours || 0}
                                    onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value)})}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Horas Reales</label>
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

            {/* Right Column: Activity Log (Timeline) */}
            <div className="w-full lg:w-96 flex flex-col bg-brand-dark/30">
                <div className="p-4 border-b border-brand-border font-semibold flex items-center gap-2 text-white">
                    <Clock size={18} className="text-brand-turquoise" />
                    Historial de Actividad
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activityLog.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500 mb-2"><Clock size={32} className="mx-auto opacity-50" /></div>
                            <p className="text-sm text-gray-500 italic">No hay actividad registrada.</p>
                            <p className="text-xs text-gray-600 mt-1">Los comentarios y cambios aparecerán aquí.</p>
                        </div>
                    ) : (
                        activityLog.map((entry) => (
                            <div key={entry.id} className={`relative pl-6 pb-3 border-l-2 ${getActivityColor(entry.type)}`}>
                                {/* Timeline Node */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-dark border-2 border-brand-border flex items-center justify-center">
                                    {getActivityIcon(entry.type)}
                                </div>
                                
                                {/* Entry Content */}
                                <div className={`${entry.type === 'comment' ? 'bg-brand-card border border-brand-border rounded-lg p-3' : ''}`}>
                                    <div className="text-sm">
                                        {formatActivityMessage(entry)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <span className="font-medium">{entry.userName}</span>
                                        <span>•</span>
                                        <span>
                                            {entry.timestamp?.seconds 
                                                ? format(new Date(entry.timestamp.seconds * 1000), "d MMM HH:mm", { locale: es }) 
                                                : 'Ahora...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={logEndRef} />
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSendComment} className="p-4 border-t border-brand-border bg-brand-card">
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="Agregar comentario..."
                            className="flex-1 bg-[#050505] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-turquoise transition"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-brand-turquoise text-brand-dark p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border bg-brand-dark/50 flex justify-between items-center shrink-0">
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
                                    className="px-4 py-2 text-gray-400 hover:text-white transition"
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
                                <Clock size={16} className="inline mr-1" /> Editar Detalles
                            </button>
                        )}
                    </div>
                 </>
             ) : (
                 <p className="text-xs text-gray-500">Contacta a tu CTO para modificar estos detalles.</p>
             )}
        </div>
      </div>
    </div>
  );
}
