export class CreateTopUpRequestDto {
  amount!: number;
  method?: string;
  referenceCode?: string;
  note?: string;
}
