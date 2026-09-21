import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import {
	GetProductByIdResponse,
	GetProductsResponse,
	INVENTORY_SERVICE_NAME,
	ValidateCartResponse
} from '@hermex/contracts'
import { createGrpcMetadata } from '@hermex/core'
import { GetProductsQueryDto } from './dto/get-products-query.dto'
import { ValidateCartDto } from './dto/validate-cart.dto'
import { ProductsCacheService } from './products-cache.service'
import { INVENTORY_GRPC_CLIENT } from './products.constants'
import { InventoryGrpcServiceClient } from './products.interface'

@Injectable()
export class ProductsService implements OnModuleInit {
	private inventoryGrpcService!: InventoryGrpcServiceClient

	constructor(
		@Inject(INVENTORY_GRPC_CLIENT)
		private readonly client: ClientGrpc,
		private readonly cacheService: ProductsCacheService
	) {}

	onModuleInit(): void {
		this.inventoryGrpcService =
			this.client.getService<InventoryGrpcServiceClient>(
				INVENTORY_SERVICE_NAME
			)
	}

	/**
	 * Retrieve paginated products with caching and singleflight protection
	 */
	async getProducts(
		query: GetProductsQueryDto,
		correlationId: string
	): Promise<GetProductsResponse> {
		const cacheKey = this.cacheService.buildCatalogKey(query)
		const isDefaultPage1 = cacheKey === 'hermex:catalog:page:1:default'
		const ttl = isDefaultPage1 ? 60 : 30

		return this.cacheService.getOrSet<GetProductsResponse>(
			cacheKey,
			ttl,
			async () => {
				const response = await firstValueFrom(
					this.inventoryGrpcService.getProducts(
						{
							page: query.page,
							limit: query.limit,
							inStockOnly: query.inStockOnly,
							search: query.search,
							sortBy: query.sortBy,
							sortOrder: query.sortOrder,
							category: query.category,
							brand: query.brand,
							specsFilterJson: query.specs
						},
						createGrpcMetadata(correlationId)
					)
				)
				return response
			}
		)
	}

	/**
	 * Retrieve individual product detail by ID with caching
	 */
	async getProductById(
		id: string,
		correlationId: string
	): Promise<GetProductByIdResponse> {
		const cacheKey = this.cacheService.buildProductKey(id)
		const ttl = 120

		return this.cacheService.getOrSet<GetProductByIdResponse>(
			cacheKey,
			ttl,
			async () => {
				const response = await firstValueFrom(
					this.inventoryGrpcService.getProductById(
						{ id },
						createGrpcMetadata(correlationId)
					)
				)
				return response
			}
		)
	}

	/**
	 * Authoritative real-time cart validation (strictly live, never cached)
	 */
	async validateCart(
		dto: ValidateCartDto,
		correlationId: string
	): Promise<ValidateCartResponse> {
		return firstValueFrom(
			this.inventoryGrpcService.validateCart(
				{
					items: dto.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						expectedPrice: item.expectedPrice
					}))
				},
				createGrpcMetadata(correlationId)
			)
		)
	}
}
