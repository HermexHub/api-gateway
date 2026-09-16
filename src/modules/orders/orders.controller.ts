import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
	CreateOrderResponse,
	GetOrderResponse
} from '@hermex/contracts'
import { CorrelationId } from '@hermex/core'
import { CurrentUserId } from '@/modules/auth/decorators/current-user-id.decorator'
import { ApiCreateOrder, ApiGetOrder } from './docs/orders.swagger'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrdersService } from './orders.service'

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiCreateOrder()
	async createOrder(
		@Body() createOrderDto: CreateOrderDto,
		@CurrentUserId() userId: string,
		@CorrelationId() correlationId: string
	): Promise<CreateOrderResponse> {
		return this.ordersService.createOrder(userId, createOrderDto, correlationId)
	}

	@Get(':id')
	@ApiGetOrder()
	async getOrder(
		@Param('id', new ParseUUIDPipe({ version: '4' })) orderId: string,
		@CorrelationId() correlationId: string
	): Promise<GetOrderResponse> {
		return this.ordersService.getOrder(orderId, correlationId)
	}
}
