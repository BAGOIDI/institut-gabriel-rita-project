import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiDollarSign, FiClock, FiActivity, FiArrowUp, FiArrowDown 
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { dashboardApi, socket } from '../services/api';

// --- Configuration Chart.js ---
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
    x: { grid: { display: false } }
  }
};

const chartData = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [{
    label: 'Revenus',
    data: [1200000, 1900000, 1500000, 2200000, 1800000, 2500000],
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    fill: true,
    tension: 0.3, // Moins courbe pour un look plus pro
  }]
};

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalStudents: 0, totalStaff: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    socket.on('connect', () => console.log("🟢 Connecté Dashboard"));
    socket.on('payment_update', (data) => {
      toast.success(`💰 Paiement: ${data.amount} FCFA`);
      addEvent({ type: 'payment', ...data });
    });
    socket.on('attendance_update', (data) => {
      const type = data.status === 'LATE' ? 'warning' : 'info';
      toast[type](`🕒 Pointage: ${data.name}`);
      addEvent({ type: 'attendance', ...data });
    });
    return () => {
      socket.off('payment_update');
      socket.off('attendance_update');
    };
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await dashboardApi.get('/summary');
      setSummary(res.data);
    } catch (err) {
      console.error("Erreur API", err);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = (evt) => {
    setRecentEvents(prev => [{ id: Date.now(), ...evt }, ...prev].slice(0, 8)); // Plus d'events visibles
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="p-4 max-w-full mx-auto"> {/* Padding réduit globalement */}
      <ToastContainer position="top-right" theme="colored" autoClose={3000} hideProgressBar />

      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-xs text-gray-500">Vue d'ensemble temps réel</p>
        </div>
        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
          Système Opérationnel
        </div>
      </div>
      
      {/* 1. Cartes Statistiques (Compactes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Étudiants" value={summary.totalStudents} icon={<FiUsers />} color="blue" />
        <StatCard title="Personnel" value={summary.totalStaff} icon={<FiActivity />} color="purple" />
        <StatCard title="Recettes (Mois)" value="2.5M" icon={<FiDollarSign />} color="green" trend="+12%" />
        <StatCard title="Retards (Jour)" value="4" icon={<FiClock />} color="orange" trend="-2" />
      </div>

      {/* 2. Section Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Graphique Financier */}
        <div className="lg:col-span-2 bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Performance Financière</h3>
          <div className="h-64 w-full">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>

        {/* Flux d'activité (Compact) */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">En direct</h3>
          <div className="flex-1 overflow-y-auto max-h-64 space-y-2 pr-1">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded">
                Aucune activité récente
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${evt.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {evt.type === 'payment' ? 'Paiement' : 'Pointage'}
                      </p>
                      <span className="text-[10px] text-gray-400">Maintenant</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {evt.type === 'payment' ? `${evt.amount} FCFA` : `${evt.name} (${evt.status})`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Widget Compact ---
function StatCard({ title, value, icon, color, trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded border ${colors[color] || colors.blue}`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-xs">
          <span className={`flex items-center font-medium ${trend.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend.includes('+') ? <FiArrowUp className="mr-1"/> : <FiArrowDown className="mr-1"/>}
            {trend}
          </span>
          <span className="text-gray-400 ml-1">vs M-1</span>
        </div>
      )}
    </div>
  );
}