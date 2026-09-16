import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	MessageEvent,
	Param,
	ParseUUIDPipe,
	Post,
	Sse
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { from, Observable } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import {
	CreateOrderResponse,
	GetOrderResponse
} from '@hermex/contracts'
import { CorrelationId } from '@hermex/core'
import { CurrentUserId } from '@/modules/auth/decorators/current-user-id.decorator'
import { OrdersSseService } from '../events/orders-sse.service'
import { ApiCreateOrder, ApiGetOrder, ApiStreamOrderLive } from './docs/orders.swagger'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrdersService } from './orders.service'

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
	constructor(
		private readonly ordersService: OrdersService,
		private readonly ordersSseService: OrdersSseService
	) {}

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

	@Sse(':id/live')
	@ApiStreamOrderLive()
	streamOrderLive(
		@Param('id', new ParseUUIDPipe({ version: '4' })) orderId: string,
		@CurrentUserId() userId: string
	): Observable<MessageEvent> {
		return from(this.ordersSseService.subscribe(orderId, userId)).pipe(
			switchMap((stream$) => stream$)
		)
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
