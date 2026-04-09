import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class CreateSchedulePayload {
  @IsInt() @IsNotEmpty() staffId: number;
  @IsInt() @IsNotEmpty() subjectId: number;
  @IsInt() @IsNotEmpty() classId: number;
  @IsInt() @IsNotEmpty() dayOfWeek: number;
  @IsString() @IsNotEmpty() startTime: string;
  @IsString() @IsNotEmpty() endTime: string;
  @IsString() @IsOptional() roomName?: string;
  @IsInt() @IsOptional() academicYearId?: number;
}