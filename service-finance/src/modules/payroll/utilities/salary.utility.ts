export class SalaryUtility {
  static calculateDelayPenalty(delayMinutes: number, hourlyRate: number): number {
    // Exemple: 1h de retard = retenue du taux horaire
    const hoursDelayed = delayMinutes / 60;
    return hoursDelayed * hourlyRate;
  }
  static calculateNetSalary(hoursWorked: number, hourlyRate: number, penalties: number): number {
    return (hoursWorked * hourlyRate) - penalties;
  }
}