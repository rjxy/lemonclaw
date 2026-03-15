import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * 创建 RSS 源 DTO
 */
export class CreateRssSourceDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  fetchInterval?: number;
}

/**
 * 更新 RSS 源 DTO
 */
export class UpdateRssSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  fetchInterval?: number;
}
