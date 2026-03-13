import { IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSchedulePayload {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  staffId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  subjectId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  dayOfWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  academicYearId?: number;
}
