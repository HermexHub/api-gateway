import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import {
	PAYMENT_PACKAGE_NAME,
	PAYMENT_PROTO_PATH
} from '@hermex/contracts'
import { PAYMENT_GRPC_CLIENT } from './payments.constants'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: PAYMENT_GRPC_CLIENT,
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: PAYMENT_PACKAGE_NAME,
						protoPath: PAYMENT_PROTO_PATH,
						url: configService.get<string>('services.paymentGrpcUrl')
					}
				})
			}
		])
	],
	controllers: [PaymentsController],
	providers: [PaymentsService],
	exports: [PaymentsService]
})
export class PaymentsModule {}
