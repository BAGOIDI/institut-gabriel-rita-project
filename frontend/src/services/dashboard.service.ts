import api from './api.service';

const BASE = '/api/dashboard/dashboard';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatItem {
  value: number | string;
  change: string;
  isPositive: boolean;
}

export interface FinancialStat {
  value: string;
  subValue: string;
  change: string;
  isPositive: boolean;
}

export interface ClassSummary {
  class: string;
  students: number;
  due: number;
  paid: number;
  rate: number;
}

export interface LatePayment {
  name: string;
  class: string;
  amount: number;
  penalty: number;
  days: number;
}

export interface Moratoire {
  name: string;
  class: string;
  amount: number;
  newDate: string;
  reason: string;
}

export interface AttendanceRecord {
  name: string;
  subject: string;
  time: string;
  status: 'PRESENT' | 'LATE';
}

export interface PartialPayment {
  name: string;
  class: string;
  total: number;
  paid: number;
  installments: number;
  lastDate: string;
}

export interface ChartPoint {
  name?: string;
  month?: string;
  presents?: number;
  retard?: number;
  total?: number;
  paye?: number;
}

export interface DashboardStats {
  stats: {
    teachersPresent:  StatItem;
    studentsEnrolled: StatItem;
    latesToday:       StatItem;
    paymentAlerts:    StatItem;
  };
  financialStats: {
    totalReceived:   FinancialStat;
    amountRemaining: FinancialStat;
    recoveryRate:    FinancialStat;
    penalties:       FinancialStat;
  };
  classSummary:      ClassSummary[];
  latePayments:      LatePayment[];
  moratoires:        Moratoire[];
  recentAttendance:  AttendanceRecord[];
  partialPayments:   PartialPayment[];
  attendanceData:    ChartPoint[];
  paymentData:       ChartPoint[];
  generatedAt:       string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const DashboardService = {
  /** Full dashboard stats — connected to service-dashboard /dashboard/stats */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get(`${BASE}/stats`);
    return response.data;
  },

  /** Lightweight health check */
  getSummary: async () => {
    const response = await api.get(`${BASE}/summary`);
    return response.data;
  },
};

export default DashboardService;
