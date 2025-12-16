import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import KanbanBoard from '../components/KanbanBoard';
import TicketForm from '../components/TicketForm';
import TaskDetailModal from '../components/TaskDetailModal';
import { Layers, CheckCircle, Zap, Activity, Plus } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userTier, userCompanyId } = useAuth();
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [metrics, setMetrics] = useState({
    active: 0,
    completed: 0,
    saved: 0,
    efficiency: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (userTier === 'premium' && userCompanyId) {
      q = query(collection(db, "companies", userCompanyId, "tasks"));
    } else {
      q = query(collection(db, "users", currentUser.uid, "tasks"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data());
      
      const active = tasks.filter(t => ['todo', 'inprogress', 'review'].includes(t.columnId)).length;
      const completed = tasks.filter(t => t.columnId === 'done').length;
      
      const completedTasks = tasks.filter(t => t.columnId === 'done');
      const saved = completedTasks.reduce((acc, t) => acc + (parseFloat(t.savingsHours) || 0), 0);
      
      let totalReal = 0;
      let savingsEff = 0;
      completedTasks.forEach(t => {
          if (parseFloat(t.actualHours) > 0) {
              totalReal += parseFloat(t.actualHours);
              savingsEff += parseFloat(t.savingsHours) || 0;
          }
      });
      const efficiency = totalReal > 0 ? (savingsEff / totalReal).toFixed(1) : (savingsEff > 0 ? savingsEff : 0);

      setMetrics({ active, completed, saved: saved.toFixed(1), efficiency });
    });

    return () => unsubscribe();
  }, [currentUser, userTier, userCompanyId]);

  return (
    <div>
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 text-transparent bg-clip-text">
                Dashboard & Kanban
                </h2>
                <p className="text-brand-text-secondary mt-1">
                Métricas clave y gestión del flujo de trabajo.
                </p>
            </div>
            <button 
                onClick={() => setIsTicketFormOpen(true)}
                className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-transform active:scale-95 shadow-lg shadow-brand-turquoise/20"
            >
                <Plus size={20} />
                Nueva Solicitud
            </button>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
                icon={<Layers size={32} className="text-brand-turquoise" />}
                title="Tareas Activas"
                value={metrics.active}
                sub="En curso o revisión"
                color="brand-turquoise"
            />
            <MetricCard 
                icon={<CheckCircle size={32} className="text-green-500" />}
                title="Completadas"
                value={metrics.completed}
                sub="Total histórico"
                color="green-500"
            />
             <MetricCard 
                icon={<Zap size={32} className="text-yellow-500" />}
                title="Horas Ahorradas"
                value={`${metrics.saved}h`}
                sub="Impacto Directo"
                color="yellow-500"
            />
             <MetricCard 
                icon={<Activity size={32} className="text-purple-500" />}
                title="Eficiencia"
                value={`${metrics.efficiency}x`}
                sub="Ahorro vs Real"
                color="purple-500"
            />
        </div>

        {/* Kanban Board */}
        <KanbanBoard onTaskClick={setSelectedTask} />

        {/* Global Modals */}
        <TicketForm 
            isOpen={isTicketFormOpen} 
            onClose={() => setIsTicketFormOpen(false)} 
            onSuccess={() => {
                // Optional: Show toast notification?
            }}
        />
        
        <TaskDetailModal 
            isOpen={!!selectedTask}
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
        />
    </div>
  )
}

function MetricCard({ icon, title, value, sub, color }) {
    return (
        <div className={`bg-linear-to-r from-brand-dark to-brand-card rounded-2xl p-6 md:p-10 mb-10 border border-brand-border relative overflow-hidden group hover:border-${color} transition duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                {icon}
            </div>
            <h4 className="font-semibold text-brand-text-secondary text-sm uppercase tracking-wider">
                {title}
            </h4>
            <p className="text-3xl font-bold mt-2 text-white">
                {value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
    );
}
