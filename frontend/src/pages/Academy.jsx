import { useState } from 'react';
import { PlayCircle, Clock, BookOpen, X } from 'lucide-react';

const MOCK_VIDEOS = [
  {
    id: 1,
    title: "Bienvenida a Groddy's Lab",
    description: "Introducción a nuestra metodología de trabajo y herramientas.",
    category: "Onboarding",
    duration: "2:30",
    thumbnail: "bg-indigo-900", // Tailwind color for placeholder
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Rickroll placeholder (or a real generic one)
  },
  {
    id: 2,
    title: "Cómo crear una Solicitud",
    description: "Guía paso a paso para reportar bugs o pedir nuevas funcionalidades.",
    category: "Procesos",
    duration: "4:15",
    thumbnail: "bg-emerald-900",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: 3,
    title: "Entendiendo el Dashboard",
    description: "Explicación de las métricas clave y cómo interpretarlas.",
    category: "Herramientas",
    duration: "3:45",
    thumbnail: "bg-purple-900",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
  // Add more mock videos
];

export default function Academy() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(MOCK_VIDEOS.map(v => v.category))];
  const filteredVideos = filter === 'All' ? MOCK_VIDEOS : MOCK_VIDEOS.filter(v => v.category === filter);

  return (
    <div className="animate-fade-in">
        <header className="mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 text-transparent bg-clip-text flex items-center gap-3">
                <BookOpen className="text-brand-turquoise" />
                Academy
            </h2>
            <p className="text-brand-text-secondary mt-1">
                Recursos educativos y tutoriales para sacar el máximo provecho.
            </p>
        </header>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                        ${filter === cat 
                            ? 'bg-brand-turquoise text-brand-dark' 
                            : 'bg-white/5 text-brand-text-secondary hover:bg-white/10 hover:text-white'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
                <div 
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`glass-card rounded-xl overflow-hidden group cursor-pointer border-white/5 hover:border-brand-turquoise/50`}
                >
                    {/* Thumbnail Placeholder */}
                    <div className={`h-48 ${video.thumbnail} relative flex items-center justify-center`}>
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <PlayCircle size={32} className="text-white fill-white/20" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono flex items-center gap-1">
                            <Clock size={10} />
                            {video.duration}
                        </div>
                    </div>
                    
                    <div className="p-4">
                        <div className="text-xs font-bold text-brand-turquoise uppercase mb-1">{video.category}</div>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{video.title}</h3>
                        <p className="text-sm text-brand-text-secondary line-clamp-2">{video.description}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Video Modal */}
        {selectedVideo && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-brand-card">
                         <h3 className="text-lg font-bold text-white">{selectedVideo.title}</h3>
                         <button onClick={() => setSelectedVideo(null)} className="text-brand-text-secondary hover:text-white">
                             <X size={24} />
                         </button>
                    </div>
                    <div className="relative pt-[56.25%] bg-black">
                        <iframe 
                            className="absolute top-0 left-0 w-full h-full"
                            src={`${selectedVideo.videoUrl}?autoplay=1`}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
                {/* Close on background click */}
                <div className="absolute inset-0 -z-10" onClick={() => setSelectedVideo(null)}></div>
             </div>
        )}
    </div>
  );
}
