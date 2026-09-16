import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as amqp from 'amqplib'
import {
	InventoryRoutingKeys,
	OrderRoutingKeys,
	PaymentRoutingKeys,
	RabbitExchanges
} from '@hermex/contracts'
import { OrderLiveEvent } from './interfaces/order-live-event.interface'
import { OrdersSseService } from './orders-sse.service'

@Injectable()
export class RabbitMQEventsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RabbitMQEventsService.name)
	private connection: amqp.ChannelModel | null = null
	private channel: amqp.Channel | null = null
	private dynamicQueueName: string | null = null

	constructor(
		private readonly configService: ConfigService,
		private readonly ordersSseService: OrdersSseService
	) { }

	async onModuleInit(): Promise<void> {
		await this.connect()
	}

	async onModuleDestroy(): Promise<void> {
		await this.close()
	}

	private async connect(): Promise<void> {
		const url =
			this.configService.get<string>('rabbitmq.url')!

		try {
			this.connection = await amqp.connect(url)
			this.channel = await this.connection.createChannel()

			this.logger.log('Connected to RabbitMQ for live events streaming')

			await this.setupBroadcastSubscriber()
		} catch (error) {
			this.logger.error(
				`Failed to connect to RabbitMQ for live events: ${(error as Error).message}`
			)
		}
	}

	private async setupBroadcastSubscriber(): Promise<void> {
		if (!this.channel) return

		// Ensure topic exchanges exist
		await this.channel.assertExchange(RabbitExchanges.ORDER, 'topic', {
			durable: true
		})
		await this.channel.assertExchange(RabbitExchanges.INVENTORY, 'topic', {
			durable: true
		})
		await this.channel.assertExchange(RabbitExchanges.PAYMENT, 'topic', {
			durable: true
		})

		// Assert temporary anonymous exclusive queue for this Gateway Pod (K8s Multi-pod Broadcast)
		const { queue } = await this.channel.assertQueue('', {
			exclusive: true,
			autoDelete: true
		})
		this.dynamicQueueName = queue

		this.logger.log(
			`Dynamic exclusive broadcast queue created: ${queue} (exclusive=true, autoDelete=true)`
		)

		// Bind Order events
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.ORDER,
			OrderRoutingKeys.CREATED
		)
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.ORDER,
			OrderRoutingKeys.CANCELLED
		)
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.ORDER,
			OrderRoutingKeys.EXPIRED
		)

		// Bind Inventory events
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.INVENTORY,
			InventoryRoutingKeys.RESERVED
		)
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.INVENTORY,
			InventoryRoutingKeys.FAILED
		)

		// Bind Payment events
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.PAYMENT,
			PaymentRoutingKeys.SUCCEEDED
		)
		await this.channel.bindQueue(
			queue,
			RabbitExchanges.PAYMENT,
			PaymentRoutingKeys.FAILED
		)

		// Consume events and route to connected SSE subscribers
		await this.channel.consume(queue, (msg) => {
			if (!msg) return

			try {
				const raw = JSON.parse(msg.content.toString())
				const routingKey = msg.fields.routingKey
				const correlationId =
					msg.properties.headers?.['x-correlation-id'] ||
					raw.correlationId ||
					'unknown'
				const orderId = raw.payload?.orderId

				if (orderId) {
					const liveEvent = this.mapToLiveEvent(
						routingKey,
						raw,
						correlationId
					)
					this.ordersSseService.emitOrderEvent(orderId, liveEvent)
				}

				this.channel?.ack(msg)
			} catch (err) {
				this.logger.error(
					`Error routing AMQP live event: ${(err as Error).message}`
				)
				this.channel?.ack(msg)
			}
		})

		this.logger.log('RabbitMQ live broadcast subscriber successfully activated')
	}

	private mapToLiveEvent(
		routingKey: string,
		raw: Record<string, any>,
		correlationId: string
	): OrderLiveEvent {
		const payload = raw.payload || {}
		const timestamp = raw.timestamp || new Date().toISOString()
		const orderId = payload.orderId

		switch (routingKey) {
			case OrderRoutingKeys.CREATED:
				return {
					orderId,
					status: 'PENDING',
					eventType: routingKey,
					title: 'Заказ создан',
					message:
						'Заказ успешно зарегистрирован и ожидает резервирования на складе.',
					timestamp,
					correlationId,
					metadata: {
						totalAmount: payload.totalAmount,
						currency: payload.currency
					}
				}

			case InventoryRoutingKeys.RESERVED:
				return {
					orderId,
					status: 'RESERVED',
					eventType: routingKey,
					title: 'Товары зарезервированы',
					message:
						'Товары забронированы на складе. Ожидается подтверждение оплаты.',
					timestamp,
					correlationId,
					metadata: {
						itemsCount: payload.items?.length
					}
				}

			case InventoryRoutingKeys.FAILED:
				return {
					orderId,
					status: 'CANCELLED',
					eventType: routingKey,
					title: 'Недостаточно остатков на складе',
					message:
						payload.reason ||
						'К сожалению, запрашиваемых товаров недостаточно на складе.',
					timestamp,
					correlationId
				}

			case PaymentRoutingKeys.SUCCEEDED:
				return {
					orderId,
					status: 'CONFIRMED',
					eventType: routingKey,
					title: 'Оплата успешно принята!',
					message:
						'Платеж подтвержден. Заказ передан в сборку и доставку.',
					timestamp,
					correlationId,
					metadata: {
						paymentId: payload.paymentId,
						amount: payload.amount,
						currency: payload.currency
					}
				}

			case PaymentRoutingKeys.FAILED:
				return {
					orderId,
					status: 'CANCELLED',
					eventType: routingKey,
					title: 'Ошибка проведения оплаты',
					message:
						payload.reason ||
						'Платеж отклонен банком. Заказ отменен.',
					timestamp,
					correlationId
				}

			case OrderRoutingKeys.CANCELLED:
				return {
					orderId,
					status: 'CANCELLED',
					eventType: routingKey,
					title: 'Заказ отменен',
					message: 'Заказ аннулирован.',
					timestamp,
					correlationId
				}

			case OrderRoutingKeys.EXPIRED:
				return {
					orderId,
					status: 'CANCELLED',
					eventType: routingKey,
					title: 'Время оплаты истекло',
					message:
						'Срок бронирования заказа истек (15 минут). Заказ аннулирован.',
					timestamp,
					correlationId
				}

			default:
				return {
					orderId,
					status: 'UNKNOWN',
					eventType: routingKey,
					title: 'Обновление статуса заказа',
					message: `Получено событие: ${routingKey}`,
					timestamp,
					correlationId
				}
		}
	}

	private async close(): Promise<void> {
		try {
			if (this.dynamicQueueName && this.channel) {
				await this.channel.deleteQueue(this.dynamicQueueName)
			}
			await this.channel?.close()
			await this.connection?.close()
			this.logger.log('RabbitMQ live events connection closed')
		} catch (error) {
			this.logger.error(
				`Error closing RabbitMQ live events connection: ${(error as Error).message}`
			)
		}
	}
}
