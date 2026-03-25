import { IsNumber, IsPositive, IsString, IsEnum, IsInt, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DisbursementType } from '../entities/disbursement.entity';

export class CreateDisbursementDto {
  @ApiProperty({ enum: DisbursementType, description: 'Type de dépense' })
  @IsEnum(DisbursementType)
  type: DisbursementType;

  @ApiProperty({ description: 'Montant de la dépense', example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Nom du bénéficiaire', example: 'Jean Dupont' })
  @IsString()
  beneficiaryName: string;

  @ApiProperty({ description: 'ID du bénéficiaire (staff, etc.)', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  beneficiaryId?: number;

  @ApiProperty({ description: 'Période (pour salaire)', required: false, example: 'Octobre 2024' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiProperty({ description: 'Description détaillée', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Méthode de paiement', example: 'BANK_TRANSFER' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Référence de transaction', required: false, example: 'TXN789' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'ID de l\'utilisateur qui enregistre', example: 1 })
  @IsInt()
  recordedBy: number;

  @ApiProperty({ description: 'Date de paiement', example: '2024-03-16', required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}
