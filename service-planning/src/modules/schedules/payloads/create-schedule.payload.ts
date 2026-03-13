import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class CreateSchedulePayload {
  @IsNumber() @IsNotEmpty() staffId: number;
  @IsNumber() @IsNotEmpty() subjectId: number;
  @IsNumber() @IsNotEmpty() classId: number;
  @IsNumber() @IsNotEmpty() dayOfWeek: number;
  @IsString() @IsNotEmpty() startTime: string;
  @IsString() @IsNotEmpty() endTime: string;
  @IsString() @IsOptional() roomName?: string;
  @IsNumber() @IsOptional() academicYearId?: number;
}