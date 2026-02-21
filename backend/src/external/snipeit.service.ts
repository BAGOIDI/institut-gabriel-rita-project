import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SnipeITService {
  constructor(private http: HttpService) {}
  async getMyAssets(email: string) {
    return [
      { id: 99, name: 'MacBook Pro M1', tag: 'ASSET-2023-44' },
    ];
  }
}
