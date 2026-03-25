import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchIndexerService } from '../../search-indexer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      { 
        name: 'Student', 
        tableName: 'students' // Table SQL réelle
      },
      { 
        name: 'Staff', 
        tableName: 'staff' // Table SQL réelle
      },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchIndexerService],
  exports: [SearchIndexerService],
})
export class SearchModule {}
