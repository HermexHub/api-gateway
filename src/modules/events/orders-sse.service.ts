import {
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	MessageEvent,
	NotFoundException,
	forwardRef
} from '@nestjs/common'
import { Observable, ReplaySubject, Subject } from 'rxjs'
import { finalize } from 'rxjs/operators'
import { MetricsService } from '../metrics/metrics.service'
import { OrdersService } from '../orders/orders.service'
import { OrderLiveEvent } from './interfaces/order-live-event.interface'

@Injectable()
export class OrdersSseService {
	private readonly logger = new Logger(OrdersSseService.name)
	private readonly clientStreams = new Map<
		string,
		Set<Subject<MessageEvent>>
	>()

	constructor(
		@Inject(forwardRef(() => OrdersService))
		private readonly ordersService: OrdersService,
		private readonly metricsService: MetricsService
	) {}

	async subscribe(
		orderId: string,
		userId: string
	): Promise<Observable<MessageEvent>> {
		// 1. Fetch order details from gRPC OrderService
		const order = await this.ordersService.getOrder(orderId, 'sse-auth-check')
		if (!order) {
			throw new NotFoundException(`Order with ID ${orderId} not found`)
		}

		// 2. Anti-IDOR Authorization Check: verify ownership
		if (order.userId !== userId) {
			this.logger.warn(
				`[Anti-IDOR] Unauthorized live stream access attempt: User ${userId} tried to access Order ${orderId} belonging to ${order.userId}`
			)
			throw new ForbiddenException(
				'Access denied: You do not have permission to view this order stream'
			)
		}

		// 3. Register client stream with ReplaySubject(1) so initial snapshot is never lost
		const subject = new ReplaySubject<MessageEvent>(1)

		if (!this.clientStreams.has(orderId)) {
			this.clientStreams.set(orderId, new Set())
		}
		this.clientStreams.get(orderId)!.add(subject)
		this.metricsService.incrementSseConnections()

		this.logger.log(
			`[SSE] Client ${userId} authorized and subscribed to Order: ${orderId} (Active listeners on this pod: ${this.clientStreams.get(orderId)!.size})`
		)

		// 4. Send initial order state snapshot
		subject.next({
			type: 'order.snapshot',
			data: {
				orderId: order.orderId,
				status: order.status,
				eventType: 'order.snapshot',
				title: 'Текущий статус заказа',
				message: `Заказ #${order.orderId.slice(0, 8)} находится в статусе ${order.status}`,
				timestamp: new Date().toISOString(),
				metadata: {
					totalAmount: order.totalAmount,
					currency: order.currency
				}
			}
		})

		return subject.asObservable().pipe(
			finalize(() => {
				this.metricsService.decrementSseConnections()
				const streamSet = this.clientStreams.get(orderId)
				if (streamSet) {
					streamSet.delete(subject)
					if (streamSet.size === 0) {
						this.clientStreams.delete(orderId)
					}
				}
				this.logger.log(
					`[SSE] Client ${userId} unsubscribed from Order: ${orderId} (Remaining: ${this.clientStreams.get(orderId)?.size || 0})`
				)
			})
		)
	}

	emitOrderEvent(orderId: string, event: OrderLiveEvent): void {
		const subscribers = this.clientStreams.get(orderId)
		if (!subscribers || subscribers.size === 0) {
			return
		}

		this.logger.log(
			`[SSE] Pushing live event '${event.eventType}' [${event.status}] to ${subscribers.size} client(s) for Order: ${orderId}`
		)

		const messageEvent: MessageEvent = {
			data: event,
			type: event.eventType
		}

		for (const clientSubject of subscribers) {
			try {
				clientSubject.next(messageEvent)
			} catch (err) {
				this.logger.error(
					`[SSE] Failed to deliver event to client for Order: ${orderId}: ${(err as Error).message}`
				)
			}
		}
	}
}
