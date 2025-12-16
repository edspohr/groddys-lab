import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Clock, CheckCircle, Activity, Target } from 'lucide-react';
// import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardMetrics({ tasks }) {
  const metrics = useMemo(() => {
    // Only category counts for Doughnut
    const categoryCounts = {
        strategy: 0,
        development: 0,
        maintenance: 0,
        infrastructure: 0
    };

    tasks.forEach(task => {
        const cat = (task.category || 'development').toLowerCase();
        if (categoryCounts[cat] !== undefined) {
            categoryCounts[cat]++;
        } else {
            categoryCounts.development++;
        }
    });

    return {
        categoryCounts,
        totalTasks: tasks.length
    };
  }, [tasks]);

  const doughnutData = {
    labels: ['Estrategia', 'Desarrollo', 'Mantenimiento', 'Infraestructura'],
    datasets: [
      {
        data: [
            metrics.categoryCounts.strategy,
            metrics.categoryCounts.development,
            metrics.categoryCounts.maintenance,
            metrics.categoryCounts.infrastructure
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)', // Indigo (Strategy)
          'rgba(45, 212, 191, 0.8)', // Teal (Dev)
          'rgba(245, 158, 11, 0.8)', // Amber (Maint)
          'rgba(99, 102, 241, 0.8)', // Violet (Infra)
        ],
        borderColor: [
            'rgba(79, 70, 229, 1)',
            'rgba(45, 212, 191, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#9ca3af', font: { family: "'Outfit', sans-serif" } }
      },
      title: { display: false }
    },
    cutout: '70%',
  };

  return (
    <div className="grid grid-cols-1 mb-8">
        {/* Card: Effort Distribution */}
        <div className="glass-card rounded-2xl p-6 border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target className="text-brand-purple" size={20} />
                Distribución de Esfuerzo (Foco Estratégico)
            </h3>
            <div className="h-64 relative flex items-center justify-center">
                 <div className="w-full max-w-md h-full">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                 </div>
                 {/* Center Text (Overlay) */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none ml-[-40px]"> {/* Offset for legend */}
                    <span className="text-3xl font-bold text-white/20">{metrics.totalTasks}</span>
                 </div>
            </div>
        </div>
    </div>
  );
}
