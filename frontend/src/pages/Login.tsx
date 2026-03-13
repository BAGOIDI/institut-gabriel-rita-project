import React, { useState } from 'react';
import { useNavigate, useLocation, Location } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import StarryNightBackground from '../components/StarryNightBackground';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useNotification();
  const { direction } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = ((location.state as any)?.from as Location)?.pathname || '/';
  const defaultAuthEnabled = Boolean((import.meta as any).env?.VITE_DEFAULT_USERNAME && (import.meta as any).env?.VITE_DEFAULT_PASSWORD);
  const defaultUser = (import.meta as any).env?.VITE_DEFAULT_USERNAME || '';
  const defaultPassword = (import.meta as any).env?.VITE_DEFAULT_PASSWORD || '';

  const [username, setUsername] = useState(defaultAuthEnabled ? defaultUser : '');
  const [password, setPassword] = useState(defaultAuthEnabled ? defaultPassword : '');
  const [loading, setLoading] = useState(false);
  const isRTL = direction === 'rtl';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      success('Connexion réussie');
      navigate(from, { replace: true });
    } catch (err: any) {
      error('Identifiants invalides ou erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex items-stretch ${isRTL ? 'flex-row-reverse' : ''}`}>
      <StarryNightBackground />
      <div className="hidden md:flex w-1/2 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-700 to-indigo-900 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className={`m-auto max-w-md ${isRTL ? 'text-right' : 'text-left'}`}>
          <img src="/images/logo.png" alt="Logo" className={`w-20 h-20 object-contain mx-${isRTL ? '0' : 'auto'} ${isRTL ? '' : 'ml-0'} ${isRTL ? 'ml-auto' : 'mr-auto'} mb-6`} />
          <h2 className="text-3xl font-bold mb-3">Bienvenue</h2>
          <p className="text-white/80 leading-relaxed">
            Connectez-vous pour accéder à votre tableau de bord et gérer la scolarité.
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40 dark:border-slate-700/60">
          <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Connexion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Entrez vos identifiants pour continuer
            </p>
          </div>
          <div className={`mb-4 rounded-xl border ${defaultAuthEnabled ? 'border-primary/50 bg-primary/10 dark:bg-primary/20' : 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'} px-3 py-2`}>
            <div className="text-xs font-semibold uppercase tracking-wide">
              {defaultAuthEnabled ? 'Mode Auth: Par défaut' : 'Mode Auth: Keycloak'}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {defaultAuthEnabled ? `Utilisateur: ${defaultUser} • Mot de passe: ${defaultPassword}` : 'Utilisez vos identifiants Keycloak'}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                Nom d’utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary ${isRTL ? 'text-right' : ''}`}
                placeholder="ex: jdoe"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/40 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary ${isRTL ? 'text-right' : ''}`}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2.5 transition disabled:opacity-60 shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
