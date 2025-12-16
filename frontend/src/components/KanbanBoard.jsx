import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { PlusCircle, Loader } from 'lucide-react';

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

export default function KanbanBoard({ onTaskClick }) {
  const { currentUser, userTier, userCompanyId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (userTier === 'premium' && userCompanyId) {
      q = query(collection(db, "companies", userCompanyId, "tasks"));
    } else {
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
  }, [currentUser, userTier, userCompanyId]);

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
    
    if (taskId) {
        // Optimistic UI update could go here
        
        try {
            const taskRef = userTier === 'premium' && userCompanyId 
                ? doc(db, "companies", userCompanyId, "tasks", taskId)
                : doc(db, "users", currentUser.uid, "tasks", taskId);
            
            await updateDoc(taskRef, { columnId: columnId });
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
                .sort((a,b) => (a.priority === 'high' ? -1 : 1)) // Simple sort example
                .map(task => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        className={`k-card bg-brand-card p-3 rounded-lg border border-brand-border ${PriorityColors[task.priority] || ""} group`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-white text-sm">{task.title}</h4>
                            {task.priority === 'high' && <span className="bg-red-900/50 text-red-200 text-[10px] px-1.5 py-0.5 rounded">Alta</span>}
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
