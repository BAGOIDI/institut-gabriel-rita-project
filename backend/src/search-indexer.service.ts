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
      connectionTimeoutSeconds: 2,
    });
  }

  private get typesense() {
    if (!this.client) {
      throw new Error('Typesense client not initialized');
    }
    return this.client;
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
}

