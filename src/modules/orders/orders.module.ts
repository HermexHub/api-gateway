import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import {
	ORDER_PACKAGE_NAME,
	ORDER_PROTO_PATH
} from '@hermex/contracts'
import { ORDER_GRPC_CLIENT } from './orders.constants'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: ORDER_GRPC_CLIENT,
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: ORDER_PACKAGE_NAME,
						protoPath: ORDER_PROTO_PATH,
						url: configService.get<string>('services.orderGrpcUrl')
					}
				})
			}
		])
	],
	controllers: [OrdersController],
	providers: [OrdersService],
	exports: [OrdersService]
})
export class OrdersModule {}
