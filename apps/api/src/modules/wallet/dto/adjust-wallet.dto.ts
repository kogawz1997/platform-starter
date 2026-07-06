import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsString, Min } from 'class-validator';

export class AdjustWalletDto {
  @IsIn(['CREDIT', 'DEBIT'])
  direction!: 'CREDIT' | 'DEBIT';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;
}
