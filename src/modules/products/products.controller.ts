import {
	Body,
	Controller,
	Get,
	Header,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query
} from '@nestjs/common'
import {
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags
} from '@nestjs/swagger'
import {
	GetProductByIdResponse,
	GetProductsResponse,
	ValidateCartResponse
} from '@hermex/contracts'
import { CorrelationId } from '@hermex/core'
import { Public } from '../auth/decorators'
import { GetProductsQueryDto } from './dto/get-products-query.dto'
import { ValidateCartDto } from './dto/validate-cart.dto'
import { ProductsService } from './products.service'

@ApiTags('Products')
@Controller()
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Public()
	@Get('products')
	@HttpCode(HttpStatus.OK)
	@Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
	@ApiOperation({
		summary: 'Get paginated catalog products',
		description:
			'Retrieve catalog items with pagination, in-stock filtering, search query, and sorting whitelist. Cached at edge/gateway for fast retrieval.'
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Paginated product catalog successfully retrieved'
	})
	async getProducts(
		@Query() query: GetProductsQueryDto,
		@CorrelationId() correlationId: string
	): Promise<GetProductsResponse> {
		return this.productsService.getProducts(query, correlationId)
	}

	@Public()
	@Get('products/:id')
	@HttpCode(HttpStatus.OK)
	@Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
	@ApiOperation({
		summary: 'Get product details by ID',
		description:
			'Retrieve detailed product information, stock status, category, and imagery.'
	})
	@ApiParam({
		name: 'id',
		description: 'Unique product identifier',
		example: 'prod-macbook-pro-16'
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Product details successfully retrieved'
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Product not found'
	})
	async getProductById(
		@Param('id') id: string,
		@CorrelationId() correlationId: string
	): Promise<GetProductByIdResponse> {
		return this.productsService.getProductById(id, correlationId)
	}

	@Public()
	@Post('cart/validate')
	@HttpCode(HttpStatus.OK)
	@Header('Cache-Control', 'no-store, no-cache, must-revalidate')
	@ApiOperation({
		summary: 'Validate shopping cart items and authoritative prices',
		description:
			'Authoritative real-time check against warehouse inventory. Detects price drift, stock availability, partial stock, and subtotal calculation before checkout.'
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Cart validation breakdown with stock statuses and totals'
	})
	async validateCart(
		@Body() dto: ValidateCartDto,
		@CorrelationId() correlationId: string
	): Promise<ValidateCartResponse> {
		return this.productsService.validateCart(dto, correlationId)
	}
}
