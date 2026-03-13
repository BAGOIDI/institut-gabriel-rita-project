import { HttpException, HttpStatus } from '@nestjs/common';
export class PayrollAlreadyExistsException extends HttpException {
  constructor(month: string) { super(`Le bulletin pour ${month} existe déjà.`, HttpStatus.CONFLICT); }
}