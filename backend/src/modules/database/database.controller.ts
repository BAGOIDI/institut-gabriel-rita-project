import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('api/database')
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Endpoint pour obtenir les statistiques de la base de données
   */
  @Get('stats')
  async getDatabaseStats() {
    return await this.databaseService.getStats();
  }

  /**
   * Endpoint pour vérifier si la base de données contient des données
   */
  @Get('check')
  async checkDatabase() {
    const stats = await this.databaseService.getStats();
    
    return {
      database: 'connected',
      hasData: stats.students.total > 0 || stats.teachers.total > 0,
      ready: true,
      ...stats
    };
  }
}
