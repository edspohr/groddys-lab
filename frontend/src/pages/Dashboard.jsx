import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase-config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import KanbanBoard from '../components/KanbanBoard';
import TicketForm from '../components/TicketForm';
import TaskDetailModal from '../components/TaskDetailModal';
import DashboardMetrics from '../components/DashboardMetrics';
import ProfileModal from '../components/ProfileModal';
import { Layers, CheckCircle, Zap, Plus, User, FileText } from 'lucide-react';
import { generateMonthlyReport } from '../utils/generateMonthlyReport';

export default function Dashboard() {
  const { currentUser, userTier, userCompanyId } = useAuth();
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]); // Raw tasks for charts
  const [metrics, setMetrics] = useState({
    active: 0,
    completed: 0,
    saved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (userTier === 'premium' && userCompanyId) {
      q = query(collection(db, "companies", userCompanyId, "tasks"));
    } else {
      q = query(collection(db, "users", currentUser.uid, "tasks"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => doc.data());
      
      const active = fetchedTasks.filter(t => ['todo', 'inprogress', 'review'].includes(t.columnId)).length;
      const completed = fetchedTasks.filter(t => t.columnId === 'done').length;
      
      const completedTasks = fetchedTasks.filter(t => t.columnId === 'done');
      const saved = completedTasks.reduce((acc, t) => acc + (parseFloat(t.savingsHours) || 0), 0);
      
      setMetrics({ active, completed, saved: saved.toFixed(1) });
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
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
            <div className="flex gap-3">
                <button 
                    onClick={() => generateMonthlyReport(tasks, metrics, "Mi Empresa", currentUser)}
                    className="glass-card px-4 py-2 rounded-lg font-semibold text-white hover:bg-white/5 transition flex items-center gap-2"
                    title="Descargar Reporte Mensual (PDF)"
                >
                    <FileText size={20} className="text-blue-400" />
                    <span className="hidden lg:inline">Reporte</span>
                </button>
                <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="glass-card px-4 py-2 rounded-lg font-semibold text-white hover:bg-white/5 transition flex items-center gap-2"
                >
                    <User size={20} className="text-brand-purple" />
                    <span className="hidden sm:inline">Perfil</span>
                </button>
                <button 
                    onClick={() => setIsTicketFormOpen(true)}
                    className="bg-brand-turquoise text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-transform active:scale-95 shadow-lg shadow-brand-turquoise/20"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Nueva Solicitud</span>
                    <span className="sm:hidden">Nueva</span>
                </button>
            </div>
        </header>

        {/* Top KPI Cards (Immediate Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Detailed Metrics Charts (Hours & Strategy) */}
        {!loading && <DashboardMetrics tasks={tasks} />}

        {/* Kanban Board */}
        <div className="animate-fade-in">
             <KanbanBoard onTaskClick={setSelectedTask} />
        </div>

        {/* Global Modals */}
        <TicketForm 
            isOpen={isTicketFormOpen} 
            onClose={() => setIsTicketFormOpen(false)} 
            onSuccess={() => {}}
        />
        
        <TaskDetailModal 
            isOpen={!!selectedTask}
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
        />
        
        <ProfileModal 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
        />
    </div>
  )
}

function MetricCard({ icon, title, value, sub, color }) {
    return (
        <div className={`glass-card rounded-2xl p-6 md:p-10 mb-10 relative overflow-hidden group border-white/5`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
            <h4 className="font-semibold text-brand-text-secondary text-sm uppercase tracking-wider mb-2">
                {title}
            </h4>
            <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/70`}>
                    {value}
                </p>
                {/* Optional colored indicator dot */}
                <div className={`w-2 h-2 rounded-full bg-${color} shadow-[0_0_8px_currentColor] text-${color}`}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">{sub}</p>
        </div>
    );
}
