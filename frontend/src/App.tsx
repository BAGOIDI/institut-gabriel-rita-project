import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BancoLayout } from './components/BancoLayout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { Timetable } from './pages/Timetable';
import { Attendance } from './pages/Attendance';
import { Finance } from './pages/Finance';
import { PaymentRules } from './pages/PaymentRules';
import { Bulletins } from './pages/Bulletins';
import { Settings } from './pages/Settings';
import { Configurations } from './pages/Configurations';

import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { updateDocumentMetadata } from './config/metadata.config';

function App() {
  // Mettre à jour les métadonnées au chargement de l'application
  React.useEffect(() => {
    updateDocumentMetadata();
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route
                path="/*"
                element={
                  <BancoLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/teachers" element={<Teachers />}/>
                      <Route path="/students" element={<Students />} />
                      <Route path="/timetable" element={<Timetable />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/payment-rules" element={<PaymentRules />} />
                      <Route path="/bulletins" element={<Bulletins />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/configurations" element={<Configurations />} />
                    </Routes>
                  </BancoLayout>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
