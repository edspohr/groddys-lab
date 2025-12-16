import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, query, onSnapshot, doc, updateDoc, collectionGroup, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, Loader } from 'lucide-react'

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'review', title: 'For Review' },
  { id: 'done', title: 'Done' }
];

const PriorityColors = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-yellow-500",
  low: "border-l-4 border-l-blue-500",
};

const CategoryBadges = {
  bug: { label: 'Bug', classes: 'bg-red-500/10 text-red-400' },
  feature: { label: 'Feature', classes: 'bg-purple-500/10 text-purple-400' },
  question: { label: 'Consulta', classes: 'bg-blue-500/10 text-blue-400' },
  default: { label: 'Tarea', classes: 'bg-gray-500/10 text-gray-400' }
};

export default function KanbanBoard({ onTaskClick, companyIdFilter }) {
  const { currentUser, userRole, userCompanyId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const isSuperuser = userRole === 'Superuser' || userRole === 'Admin';
  // Effective company: use prop if given, else fall back to user's company
  const effectiveCompanyId = companyIdFilter !== undefined ? companyIdFilter : userCompanyId;

  useEffect(() => {
    if (!currentUser) return;

    let q;
    
    if (isSuperuser && !effectiveCompanyId) {
      // Superuser viewing ALL companies
      q = collectionGroup(db, "tasks");
    } else if (effectiveCompanyId) {
      // Specific company
      q = query(collection(db, "companies", effectiveCompanyId, "tasks"));
    } else {
      // Freemium user
      q = query(collection(db, "users", currentUser.uid, "tasks"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, effectiveCompanyId, isSuperuser]);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Add opacity class immediately? React handles this via state better usually
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    const previousColumnId = task?.columnId;
    
    if (taskId && previousColumnId !== columnId) {
        try {
            // Determine collection path using effectiveCompanyId
            const collectionPath = effectiveCompanyId
                ? `companies/${effectiveCompanyId}/tasks`
                : `users/${currentUser.uid}/tasks`;

            const taskRef = doc(db, collectionPath, taskId);
            await updateDoc(taskRef, { columnId: columnId });

            // Add status_change activity log entry
            await addDoc(collection(db, `${collectionPath}/${taskId}/activityLog`), {
                type: 'status_change',
                timestamp: serverTimestamp(),
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                details: { from: previousColumnId, to: columnId }
            });
        } catch (error) {
            console.error("Error moving task:", error);
        }
    }
    setDraggedTaskId(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-brand-turquoise" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNS.map(column => (
        <div 
            key={column.id} 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">{column.title}</h3>
            {column.id === 'todo' && (
              <button className="text-brand-text-secondary hover:text-white">
                <PlusCircle size={20} />
              </button>
            )}
          </div>
          
          <div className="space-y-4 min-h-[200px] border border-dashed border-gray-800 rounded-lg p-2 transition-colors hover:border-brand-border">
            {tasks
                .filter(task => task.columnId === column.id)
                .sort((a, b) => {
                    const weight = { high: 3, medium: 2, low: 1 };
                    return (weight[b.priority] || 0) - (weight[a.priority] || 0);
                })
                .map(task => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        className={`k-card bg-brand-card p-3 rounded-lg border border-brand-border ${PriorityColors[task.priority] || ""} group ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-white text-sm">{task.title}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border border-white/5 ${CategoryBadges[task.category]?.classes || CategoryBadges.default.classes}`}>
                                {CategoryBadges[task.category]?.label || task.category || 'Tarea'}
                            </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                             {task.priority === 'high' && <span className="bg-red-900/30 text-red-200 text-[10px] px-1.5 py-0.5 rounded">Prioridad Alta</span>}
                        </div>
                        <p className="text-xs text-brand-text-secondary line-clamp-2">{task.description}</p>
                        
                        {(task.estimatedHours || task.savingsHours) && (
                            <div className="mt-2 flex gap-2 text-[10px] text-brand-text-secondary">
                                {task.estimatedHours && <span>{task.estimatedHours}h Est.</span>}
                                {task.savingsHours && <span className="text-brand-turquoise">{task.savingsHours}h Ahorro</span>}
                            </div>
                        )}
                    </div>
                ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}
