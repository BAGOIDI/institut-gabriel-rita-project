import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { InvalidExcelFormatException } from '../exceptions/student.exceptions';

@Injectable()
export class ExcelProvider {
  parseBuffer(buffer: Buffer): any[] {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } catch (e) {
      throw new InvalidExcelFormatException();
    }
  }
}