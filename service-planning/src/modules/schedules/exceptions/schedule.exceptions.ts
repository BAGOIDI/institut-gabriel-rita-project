import { HttpException, HttpStatus } from '@nestjs/common';
export class ScheduleConflictException extends HttpException {
  constructor(message: string = 'Conflit d\'horaire détecté pour cet enseignant, cette classe ou cette salle.') { 
    super(message, HttpStatus.CONFLICT); 
  }
}