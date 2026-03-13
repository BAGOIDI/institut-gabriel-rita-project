import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduleUtility {
  /**
   * Allowed class time slots (start/end) for Institut Gabriel Rita.
   * These slots intentionally exclude breaks (PP/GP) to prevent scheduling during pauses.
   */
  static readonly ALLOWED_CLASS_SLOTS: Array<{ start: string; end: string }> = [
    // Day
    { start: '08:00', end: '09:50' },
    { start: '10:05', end: '12:00' },
    { start: '13:00', end: '14:50' },
    { start: '15:05', end: '17:00' },
    // Evening
    { start: '17:30', end: '19:20' },
    { start: '19:35', end: '21:00' },
  ];

  /**
   * Format time to HH:mm
   */
  static formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length < 2) return time;
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  static isValidTimeHHmm(time: string): boolean {
    if (!time) return false;
    const t = this.formatTime(time);
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  }

  /**
   * Convert time string to minutes since midnight
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = this.formatTime(time).split(':').map(Number);
    return hours * 60 + minutes;
  }

  static isAllowedClassSlot(startTime: string, endTime: string): boolean {
    const start = this.formatTime(startTime);
    const end = this.formatTime(endTime);
    return this.ALLOWED_CLASS_SLOTS.some(s => s.start === start && s.end === end);
  }

  /**
   * Check if two time ranges overlap
   */
  static isOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }
}
