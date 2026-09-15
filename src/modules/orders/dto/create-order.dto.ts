import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
	ArrayMinSize,
	IsArray,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	ValidateNested
} from 'class-validator'

export class CreateOrderItemDto {
	@ApiProperty({
		example: 'prod-001',
		description: 'Unique product identifier'
	})
	@IsString()
	@IsNotEmpty({ message: 'productId is required' })
	productId!: string

	@ApiProperty({
		example: 2,
		description: 'Item quantity (must be a positive integer)'
	})
	@IsInt({ message: 'quantity must be an integer' })
	@IsPositive({ message: 'quantity must be greater than 0' })
	quantity!: number

	@ApiProperty({
		example: 29.99,
		description: 'Item unit price (must be positive)'
	})
	@IsNumber({}, { message: 'price must be a number' })
	@IsPositive({ message: 'price must be greater than 0' })
	price!: number
}

export class CreateOrderDto {
	@ApiProperty({
		type: [CreateOrderItemDto],
		description: 'List of order items'
	})
	@IsArray({ message: 'items must be an array' })
	@ArrayMinSize(1, { message: 'Order must contain at least one item' })
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items!: CreateOrderItemDto[]

	@ApiProperty({
		example: '123 Main Street, Suite 400, New York, NY 10001',
		description: 'Delivery destination address',
		required: false
	})
	@IsOptional()
	@IsString({ message: 'deliveryAddress must be a string' })
	deliveryAddress?: string
}
