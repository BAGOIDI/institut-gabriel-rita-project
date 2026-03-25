import React from 'react';

// Icône Dashboard - basée sur le style BanCo
export const BancoDashboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 7H17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 7V17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M13 7V17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
  </svg>
);

// Icône Enseignants
export const BancoTeachersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 11C12.2091 11 14 9.20914 14 7C14 4.79086 12.2091 3 10 3C7.79086 3 6 4.79086 6 7C6 9.20914 7.79086 11 10 11Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 17C3 14.2386 5.23858 12 8 12H12C14.7614 12 17 14.2386 17 17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
  </svg>
);

// Icône Étudiants
export const BancoStudentsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 12C12.2091 12 14 10.2091 14 8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8C6 10.2091 7.79086 12 10 12Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 16C3 13.2386 5.23858 11 8 11H12C14.7614 11 17 13.2386 17 16" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M13 6L15 8L13 10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Icône Emploi du temps
export const BancoTimetableIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V6Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 8H17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 4V8" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M13 4V8" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 11H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 14H11" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
  </svg>
);

// Icône Présences
export const BancoAttendanceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M10 6V10L13 12" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M7 9L9 11L13 7" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Icône Paiements
export const BancoPaymentsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V6Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 9H17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 12H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 14H11" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <circle 
      cx="14" 
      cy="13" 
      r="2" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
  </svg>
);

// Icône Finance (Gestion financière complète)
export const BancoFinanceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 2L3 6V16L10 20L17 16V6L10 2Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path 
      d="M10 14C11.1046 14 12 13.1046 12 12C12 10.8954 11.1046 10 10 10C8.89543 10 8 10.8954 8 12C8 13.1046 8.89543 14 10 14Z" 
      fill="currentColor"
    />
    <path 
      d="M7 8L10 6L13 8" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Icône Règles de paiement
export const BancoPaymentRulesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M15 4H5C3.89543 4 3 4.89543 3 6V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V6C17 4.89543 16.1046 4 15 4Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 9H17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 12H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 6H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <circle 
      cx="15" 
      cy="7" 
      r="1" 
      fill="currentColor"
    />
    <circle 
      cx="15" 
      cy="13" 
      r="1" 
      fill="currentColor"
    />
  </svg>
);

// Icône Rapports
export const BancoReportsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V6Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M3 9H17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 12H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M7 6H13" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M10 4V17" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
  </svg>
);

// Icône Paramètres
export const BancoSettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M14.31 5.69L15.71 4.29" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M17 10H19" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M14.31 14.31L15.71 15.71" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M10 17V19" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M5.69 14.31L4.29 15.71" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M3 10H1" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M5.69 5.69L4.29 4.29" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);