import { IsArray, ValidateNested, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class CategoryOrderItem {
  @IsInt()
  id: number;

  @IsInt()
  @Min(0)
  order: number;
}

export class UpdateCategoryOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  data: CategoryOrderItem[];
}
