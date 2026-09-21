import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min
} from 'class-validator'

export class GetProductsQueryDto {
	@ApiPropertyOptional({
		description: 'Page number for pagination (starts at 1)',
		default: 1,
		example: 1
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'page must be an integer' })
	@Min(1, { message: 'page must be at least 1' })
	page: number = 1

	@ApiPropertyOptional({
		description: 'Number of items per page (maximum 100)',
		default: 20,
		example: 20
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'limit must be an integer' })
	@Min(1, { message: 'limit must be at least 1' })
	@Max(100, { message: 'limit cannot exceed 100' })
	limit: number = 20

	@ApiPropertyOptional({
		description: 'Filter only products with available stock (> 0)',
		default: false,
		example: true
	})
	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
	@IsBoolean({ message: 'inStockOnly must be a boolean' })
	inStockOnly: boolean = false

	@ApiPropertyOptional({
		description: 'Search string filtering product name, description, or SKU',
		example: 'MacBook'
	})
	@IsOptional()
	@IsString({ message: 'search must be a string' })
	@MaxLength(100, { message: 'search term cannot exceed 100 characters' })
	search?: string

	@ApiPropertyOptional({
		description: 'Field to sort products by',
		enum: ['createdAt', 'price', 'name', 'stockQuantity'],
		default: 'createdAt'
	})
	@IsOptional()
	@IsIn(['createdAt', 'price', 'name', 'stockQuantity'], {
		message: 'sortBy must be one of: createdAt, price, name, stockQuantity'
	})
	sortBy: string = 'createdAt'

	@ApiPropertyOptional({
		description: 'Sort direction order',
		enum: ['ASC', 'DESC', 'asc', 'desc'],
		default: 'DESC'
	})
	@IsOptional()
	@IsIn(['ASC', 'DESC', 'asc', 'desc'], {
		message: 'sortOrder must be ASC or DESC'
	})
	sortOrder: string = 'DESC'

	@ApiPropertyOptional({
		description: 'Filter products by category',
		example: 'Laptops'
	})
	@IsOptional()
	@IsString({ message: 'category must be a string' })
	@MaxLength(100)
	category?: string

	@ApiPropertyOptional({
		description: 'Filter products by manufacturer brand',
		example: 'Apple'
	})
	@IsOptional()
	@IsString({ message: 'brand must be a string' })
	@MaxLength(100)
	brand?: string

	@ApiPropertyOptional({
		description: 'Faceted specs filter as JSON string (e.g. {"ram":"32 GB"})',
		example: '{"ram":"32 GB"}'
	})
	@IsOptional()
	@IsString()
	specs?: string
}
