import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MoodleService {
  constructor(private http: HttpService) {}
  async getCourses(email: string) {
    // Mock Data for now
    return [
      { id: 101, title: 'Introduction à React', progress: 80 },
      { id: 102, title: 'NestJS Avancé', progress: 45 },
    ];
  }
}
