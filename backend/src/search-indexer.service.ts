import { Injectable, OnModuleInit } from '@nestjs/common';
import Typesense from 'typesense';

@Injectable()
export class SearchIndexerService implements OnModuleInit {
  private client: Typesense.Client | null = null;

  onModuleInit() {
    const host = process.env.TYPESENSE_HOST || 'typesense';
    const port = Number(process.env.TYPESENSE_PORT || 8108);
    const apiKey = process.env.TYPESENSE_API_KEY || 'xyz';

    this.client = new Typesense.Client({
      nodes: [
        {
          host,
          port,
          protocol: 'http',
        },
      ],
      apiKey,
      connectionTimeoutSeconds: 5,
    });

    // Initialiser les collections au démarrage
    this.initializeCollections();
  }

  private get typesense() {
    if (!this.client) {
      throw new Error('Typesense client not initialized');
    }
    return this.client;
  }

  /**
   * Initialise les collections Typesense si elles n'existent pas
   */
  async initializeCollections() {
    try {
      // Collection Students
      try {
        await this.typesense.collections('students').retrieve();
        console.log('✅ Collection "students" already exists');
      } catch (e) {
        if (e?.name === 'ObjectNotFound') {
          await this.typesense.collections().create({
            name: 'students',
            fields: [
              { name: 'id', type: 'string' },
              { name: 'first_name', type: 'string', facet: false },
              { name: 'last_name', type: 'string', facet: false },
              { name: 'email', type: 'string', facet: false },
              { name: 'status', type: 'string', facet: true },
              { name: 'full_name', type: 'string', facet: false },
            ],
            default_sorting_field: 'full_name',
          });
          console.log('✅ Collection "students" created');
        }
      }

      // Collection Teachers
      try {
        await this.typesense.collections('teachers').retrieve();
        console.log('✅ Collection "teachers" already exists');
      } catch (e) {
        if (e?.name === 'ObjectNotFound') {
          await this.typesense.collections().create({
            name: 'teachers',
            fields: [
              { name: 'id', type: 'string' },
              { name: 'first_name', type: 'string', facet: false },
              { name: 'last_name', type: 'string', facet: false },
              { name: 'email', type: 'string', facet: false },
              { name: 'phone_number', type: 'string', facet: false },
              { name: 'specialty', type: 'string', facet: true },
              { name: 'contract_type', type: 'string', facet: true },
              { name: 'status', type: 'string', facet: true },
              { name: 'full_name', type: 'string', facet: false },
            ],
            default_sorting_field: 'full_name',
          });
          console.log('✅ Collection "teachers" created');
        }
      }

      console.log('🎯 Typesense collections initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Typesense collections:', error);
    }
  }

  async upsertStudent(student: any) {
    const document = {
      id: student.id?.toString(),
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      status: student.status,
      full_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
    };

    await this.typesense.collections('students').documents().upsert(document);
    console.log(`🔍 Typesense index upserted for student ${student.email}`);
  }

  async upsertTeacher(staff: any) {
    const document = {
      id: staff.id?.toString(),
      first_name: staff.firstName,
      last_name: staff.lastName,
      email: staff.email,
      phone_number: staff.phoneNumber,
      specialty: staff.specialty,
      contract_type: staff.contractType,
      status: staff.status,
      full_name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
    };

    await this.typesense.collections('teachers').documents().upsert(document);
    console.log(`🔍 Typesense index upserted for teacher ${staff.email || staff.phoneNumber}`);
  }

  /**
   * Indexe en masse des étudiants depuis la base de données
   */
  async bulkIndexStudents(students: any[]) {
    try {
      const documents = students.map(student => ({
        id: student.id?.toString(),
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        status: student.status,
        full_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      }));

      await this.typesense.collections('students').documents().import(documents, { action: 'upsert' });
      console.log(`✅ Bulk indexed ${students.length} students in Typesense`);
    } catch (error) {
      console.error(`❌ Error bulk indexing students:`, error);
      throw error;
    }
  }

  /**
   * Indexe en masse des enseignants depuis la base de données
   */
  async bulkIndexTeachers(teachers: any[]) {
    try {
      const documents = teachers.map(staff => ({
        id: staff.id?.toString(),
        first_name: staff.firstName,
        last_name: staff.lastName,
        email: staff.email,
        phone_number: staff.phoneNumber,
        specialty: staff.specialty,
        contract_type: staff.contractType,
        status: staff.status,
        full_name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      }));

      await this.typesense.collections('teachers').documents().import(documents, { action: 'upsert' });
      console.log(`✅ Bulk indexed ${teachers.length} teachers in Typesense`);
    } catch (error) {
      console.error(`❌ Error bulk indexing teachers:`, error);
      throw error;
    }
  }

  /**
   * Vérifie la connexion à Typesense
   */
  async checkConnection(): Promise<boolean> {
    try {
      const health = await this.typesense.health.retrieve();
      console.log('🏥 Typesense health status:', health);
      return health.ok === true;
    } catch (error) {
      console.error('❌ Typesense health check failed:', error);
      return false;
    }
  }
}

