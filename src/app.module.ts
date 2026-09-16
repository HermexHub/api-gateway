import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware'
import appConfig from './config/app.config'
import databaseConfig from './config/database.config'
import rabbitmqConfig from './config/rabbitmq.config'
import servicesConfig from './config/services.config'
import { validateEnv } from './config/env.validation'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { EventsModule } from './modules/events/events.module'
import { HealthModule } from './modules/health/health.module'
import { MetricsModule } from './modules/metrics/metrics.module'
import { OrdersModule } from './modules/orders/orders.module'
import { PaymentsModule } from './modules/payments/payments.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				`.env.${process.env.NODE_ENV || 'development'}.local`,
				`.env.${process.env.NODE_ENV || 'development'}`,
				'.env'
			],
			validate: validateEnv,
			load: [appConfig, databaseConfig, servicesConfig, rabbitmqConfig]
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => config.get('database')!
		}),
		AuthModule,
		HealthModule,
		MetricsModule,
		EventsModule,
		OrdersModule,
		PaymentsModule
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard
		}
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationIdMiddleware).forRoutes('{*path}')
	}
}
