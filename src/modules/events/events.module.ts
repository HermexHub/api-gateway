import { Module, forwardRef } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { OrdersModule } from '../orders/orders.module'
import { OrdersSseService } from './orders-sse.service'
import { RabbitMQEventsService } from './rabbitmq-events.service'

@Module({
	imports: [ConfigModule, forwardRef(() => OrdersModule)],
	providers: [OrdersSseService, RabbitMQEventsService],
	exports: [OrdersSseService]
})
export class EventsModule {}
