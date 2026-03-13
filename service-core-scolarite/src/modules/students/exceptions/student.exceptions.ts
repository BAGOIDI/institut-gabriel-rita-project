import { HttpException, HttpStatus } from '@nestjs/common';
export class InvalidExcelFormatException extends HttpException {
  constructor() { super('Le format du fichier Excel est invalide.', HttpStatus.BAD_REQUEST); }
}