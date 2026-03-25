import { Controller, Get, Post } from '@nestjs/common';
import { SearchIndexerService } from '../search-indexer.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('api/search')
export class SearchController {
  constructor(
    private searchIndexer: SearchIndexerService,
    @InjectRepository('Student')
    private studentRepository: Repository<any>,
    @InjectRepository('Staff')
    private staffRepository: Repository<any>,
  ) {}

  /**
   * Endpoint pour indexer tous les étudiants depuis la base de données
   */
  @Post('index/students')
  async indexAllStudents() {
    try {
      console.log('🔄 Starting full student indexation...');
      
      // Récupérer tous les étudiants de la base
      const students = await this.studentRepository.find();
      
      if (students.length === 0) {
        return { 
          success: true, 
          message: 'No students to index', 
          indexed: 0 
        };
      }

      // Indexation en masse dans Typesense
      await this.searchIndexer.bulkIndexStudents(students);
      
      return { 
        success: true, 
        message: `Successfully indexed ${students.length} students`, 
        indexed: students.length 
      };
    } catch (error) {
      console.error('❌ Error indexing students:', error);
      return { 
        success: false, 
        message: error.message,
        indexed: 0 
      };
    }
  }

  /**
   * Endpoint pour indexer tous les enseignants depuis la base de données
   */
  @Post('index/teachers')
  async indexAllTeachers() {
    try {
      console.log('🔄 Starting full teacher indexation...');
      
      // Récupérer tous les enseignants de la base
      const teachers = await this.staffRepository.find({
        where: { contractType: 'TEACHING' } // Seulement les enseignants
      });
      
      if (teachers.length === 0) {
        return { 
          success: true, 
          message: 'No teachers to index', 
          indexed: 0 
        };
      }

      // Indexation en masse dans Typesense
      await this.searchIndexer.bulkIndexTeachers(teachers);
      
      return { 
        success: true, 
        message: `Successfully indexed ${teachers.length} teachers`, 
        indexed: teachers.length 
      };
    } catch (error) {
      console.error('❌ Error indexing teachers:', error);
      return { 
        success: false, 
        message: error.message,
        indexed: 0 
      };
    }
  }

  /**
   * Endpoint pour indexer toutes les données (étudiants + enseignants)
   */
  @Post('index/all')
  async indexAllData() {
    try {
      console.log('🔄 Starting full database indexation...');
      
      const studentResult = await this.indexAllStudents();
      const teacherResult = await this.indexAllTeachers();
      
      return {
        success: true,
        message: 'Full indexation completed',
        results: {
          students: studentResult,
          teachers: teacherResult
        }
      };
    } catch (error) {
      console.error('❌ Error in full indexation:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  /**
   * Endpoint pour vérifier la santé de Typesense
   */
  @Get('health')
  async checkTypesenseHealth() {
    const isHealthy = await this.searchIndexer.checkConnection();
    return {
      service: 'typesense',
      healthy: isHealthy,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint pour réinitialiser les collections Typesense
   */
  @Post('reset-collections')
  async resetCollections() {
    try {
      console.log('🔄 Resetting Typesense collections...');
      
      // Supprimer les collections existantes
      try {
        await this.searchIndexer['typesense'].collections('students').delete();
        console.log('✅ Deleted students collection');
      } catch (e) {
        console.log('⚠️ Students collection does not exist');
      }
      
      try {
        await this.searchIndexer['typesense'].collections('teachers').delete();
        console.log('✅ Deleted teachers collection');
      } catch (e) {
        console.log('⚠️ Teachers collection does not exist');
      }
      
      // Recréer les collections
      await this.searchIndexer.initializeCollections();
      
      return {
        success: true,
        message: 'Collections reset successfully'
      };
    } catch (error) {
      console.error('❌ Error resetting collections:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
}
