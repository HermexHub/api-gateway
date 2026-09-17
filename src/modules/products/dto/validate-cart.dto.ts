import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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

export class CartItemInputDto {
	@ApiProperty({
		description: 'Unique identifier of the product',
		example: 'prod-macbook-pro-16'
	})
	@IsString({ message: 'productId must be a string' })
	@IsNotEmpty({ message: 'productId is required' })
	productId!: string

	@ApiProperty({
		description: 'Quantity requested by the user',
		example: 1,
		minimum: 1
	})
	@IsInt({ message: 'quantity must be an integer' })
	@IsPositive({ message: 'quantity must be greater than 0' })
	quantity!: number

	@ApiPropertyOptional({
		description:
			'Client cached price in USD to verify if price changed since item was added to cart',
		example: 3499.99
	})
	@IsOptional()
	@IsNumber({}, { message: 'expectedPrice must be a number' })
	@IsPositive({ message: 'expectedPrice must be greater than 0' })
	expectedPrice?: number
}

export class ValidateCartDto {
	@ApiProperty({
		type: [CartItemInputDto],
		description: 'Array of items currently in the cart to be validated'
	})
	@IsArray({ message: 'items must be an array' })
	@ArrayMinSize(1, { message: 'At least one item is required for cart validation' })
	@ValidateNested({ each: true })
	@Type(() => CartItemInputDto)
	items!: CartItemInputDto[]
}
