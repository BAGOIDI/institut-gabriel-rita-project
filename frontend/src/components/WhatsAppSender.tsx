import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Smartphone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  QrCode,
  RefreshCw,
  Users,
  UserCheck
} from 'lucide-react';
import api from '../services/api.service';

interface WhatsAppSenderProps {
  targetType: 'class' | 'teacher';
  targetId: string;
  targetName: string;
  teacherName?: string;
}

const WhatsAppSender: React.FC<WhatsAppSenderProps> = ({
  targetType,
  targetId,
  targetName,
  teacherName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [period, setPeriod] = useState<'all' | 'day' | 'evening'>('all');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wahaStatus, setWahaStatus] = useState<{connected: boolean; status: string} | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Vérifier le statut WAHA
  useEffect(() => {
    if (isOpen) {
      checkWahaStatus();
    }
  }, [isOpen]);

  const checkWahaStatus = async () => {
    try {
      const response = await api.get('/api/reports/whatsapp/status');
      setWahaStatus(response.data);
    } catch (error) {
      console.error('Erreur vérification WAHA:', error);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await api.get('/api/reports/whatsapp/qr');
      setQrCode(response.data.qrCode);
      setShowQR(true);
    } catch (error) {
      console.error('Erreur récupération QR:', error);
    }
  };

  const handleSend = async () => {
    if (!phone) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = targetType === 'class' 
        ? `/api/reports/whatsapp/send-schedule/${targetId}`
        : `/api/reports/whatsapp/send-to-teacher/${targetId}`;

      const payload = {
        phone: (phone || '').replace(/\D/g, ''), // Nettoyer le numéro
        period,
        teacher_name: teacherName || 'Enseignant'
      };

      const response = await api.post(endpoint, payload);
      
      setSuccess(true);
      
      // Fermer après 2 secondes
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setPhone('');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Formater le numéro de téléphone
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('237')) {
      return numbers;
    }
    return '237' + numbers;
  };

  return (
    <>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        Envoyer par WhatsApp
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Envoyer par WhatsApp
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {targetType === 'class' ? 'Classe' : 'Enseignant'}: {targetName}
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Statut WAHA */}
              <div className={`p-4 rounded-lg border-2 ${
                wahaStatus?.connected 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {wahaStatus?.connected ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className={`font-bold ${wahaStatus?.connected ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        WhatsApp {wahaStatus?.connected ? 'Connecté' : 'Déconnecté'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {wahaStatus?.status || 'Vérification...'}
                      </p>
                    </div>
                  </div>
                  {!wahaStatus?.connected && (
                    <button
                      onClick={fetchQRCode}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      title="Scanner le QR code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* QR Code Modal */}
              {showQR && qrCode && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-xl p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg">Scanner le QR Code</h4>
                      <button onClick={() => setShowQR(false)}>
                        <XCircle className="w-6 h-6 text-gray-500" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <img 
                        src={qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-full h-auto border-2 border-gray-200 rounded-lg"
                      />
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold mb-2">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>Ouvrez WhatsApp sur votre téléphone</li>
                          <li>Allez dans Paramètres → Appareils connectés</li>
                          <li>Scannez ce QR code</li>
                        </ol>
                      </div>
                      <button
                        onClick={fetchQRCode}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Rafraîchir le QR
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="600000000"
                    className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: 2376XXXXXXXX (sans le +)
                </p>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Période à envoyer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPeriod('all')}
                    className={`py-2.5 rounded-lg font-medium transition-all ${
                      period === 'all'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Complet
                  </button>
                  <button
                    onClick={() => setPeriod('day')}
                    className={`py-2.5 rounded-lg font-medium transition-all ${
                      period === 'day'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Jour
                  </button>
                  <button
                    onClick={() => setPeriod('evening')}
                    className={`py-2.5 rounded-lg font-medium transition-all ${
                      period === 'evening'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Soir
                  </button>
                </div>
              </div>

              {/* Aperçu du message */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Aperçu du message
                </p>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p>📚 <strong>EMPLOI DU TEMPS - INSTITUT GABRIEL RITA</strong> 📚</p>
                  <p>👨‍🏫 <strong>Enseignant:</strong> {teacherName || 'Enseignant'}</p>
                  <p>📖 <strong>Classe:</strong> {targetName}</p>
                  <p>📅 <strong>Période:</strong> {period === 'all' ? 'Complète' : period === 'day' ? 'Jour' : 'Soir'}</p>
                  <p className="text-gray-500 italic">+ Résumé détaillé des cours...</p>
                </div>
              </div>

              {/* Messages d'erreur et succès */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
                  <XCircle className="w-4 h-4 inline mr-2" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Message envoyé avec succès !
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !wahaStatus?.connected}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppSender;
