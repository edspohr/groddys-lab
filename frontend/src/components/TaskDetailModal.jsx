import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { X, Save, Trash2, Clock, AlertTriangle, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { userRole, currentUser } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Comment System State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (task) {
        setFormData({ ...task });
        setIsEditing(false);
        setComments([]); // Clear previous comments
    }
  }, [task]);

  // Subscribe to comments
  useEffect(() => {
    if (!task || !isOpen) return;

    const collectionPath = (task.companyId)
        ? `companies/${task.companyId}/tasks/${task.id}/comments`
        : `users/${currentUser.uid}/tasks/${task.id}/comments`;

    const q = query(collection(db, collectionPath), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const docComments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setComments(docComments);
    });

    return () => unsubscribe();
  }, [task, isOpen, currentUser]);

  // Scroll to bottom of comments
  useEffect(() => {
      if(commentsEndRef.current) {
          commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [comments]);


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

  const handleSendComment = async (e) => {
      e.preventDefault();
      if(!newComment.trim()) return;

      try {
          const collectionPath = (task.companyId)
            ? `companies/${task.companyId}/tasks/${task.id}/comments`
            : `users/${currentUser.uid}/tasks/${task.id}/comments`;
          
          await addDoc(collection(db, collectionPath), {
              text: newComment,
              userId: currentUser.uid,
              userName: currentUser.displayName || currentUser.email,
              createdAt: serverTimestamp()
          });
          setNewComment('');
      } catch (error) {
          console.error("Error sending comment:", error);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-card w-full max-w-4xl rounded-xl border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-brand-border bg-brand-dark/50 shrink-0">
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

        {/* Content Layout: 2 Columns on large screens */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Left Column: Task Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-brand-border">
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

            {/* Right Column: Comments */}
            <div className="w-full lg:w-80 flex flex-col bg-brand-dark/30">
                <div className="p-4 border-b border-brand-border font-semibold flex items-center gap-2">
                    <MessageSquare size={18} className="text-brand-turquoise" />
                    Comentarios
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-sm text-brand-text-secondary text-center italic mt-4">No hay comentarios aún.</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={`flex flex-col ${comment.userId === currentUser.uid ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                    comment.userId === currentUser.uid 
                                    ? 'bg-brand-turquoise/10 text-brand-text-primary border border-brand-turquoise/30' 
                                    : 'bg-brand-card border border-brand-border text-gray-300'
                                }`}>
                                    <p>{comment.text}</p>
                                </div>
                                <span className="text-xs text-brand-text-secondary mt-1 px-1">
                                    {comment.userName} • {comment.createdAt?.seconds ? format(new Date(comment.createdAt.seconds * 1000), 'dd MMM HH:mm') : 'Enviando...'}
                                </span>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                <form onSubmit={handleSendComment} className="p-4 border-t border-brand-border bg-brand-card">
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="Escribe un comentario..."
                            className="flex-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-turquoise transition"
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
                                <Clock size={16} className="inline mr-1" /> Editar Detalles
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
