import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import {
	CreateOrderResponse,
	GetOrderResponse,
	ORDER_SERVICE_NAME
} from '@hermex/contracts'
import { createGrpcMetadata } from '@hermex/core'
import { CreateOrderDto } from './dto/create-order.dto'
import { ORDER_GRPC_CLIENT } from './orders.constants'
import { OrderGrpcServiceClient } from './orders.interface'

@Injectable()
export class OrdersService implements OnModuleInit {
	private orderGrpcService!: OrderGrpcServiceClient

	constructor(
		@Inject(ORDER_GRPC_CLIENT)
		private readonly client: ClientGrpc
	) {}

	onModuleInit(): void {
		this.orderGrpcService =
			this.client.getService<OrderGrpcServiceClient>(ORDER_SERVICE_NAME)
	}

	async createOrder(
		userId: string,
		dto: CreateOrderDto,
		correlationId: string
	): Promise<CreateOrderResponse> {
		return firstValueFrom(
			this.orderGrpcService.createOrder(
				{
					userId,
					items: dto.items,
					deliveryAddress: dto.deliveryAddress
				},
				createGrpcMetadata(correlationId)
			)
		)
	}

	async getOrder(
		orderId: string,
		correlationId: string
	): Promise<GetOrderResponse> {
		return firstValueFrom(
			this.orderGrpcService.getOrder(
				{ orderId },
				createGrpcMetadata(correlationId)
			)
		)
	}
}

