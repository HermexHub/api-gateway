import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import {
	INVENTORY_PACKAGE_NAME,
	INVENTORY_PROTO_PATH
} from '@hermex/contracts'
import { ProductsCacheService } from './products-cache.service'
import { INVENTORY_GRPC_CLIENT } from './products.constants'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: INVENTORY_GRPC_CLIENT,
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: INVENTORY_PACKAGE_NAME,
						protoPath: INVENTORY_PROTO_PATH,
						url: configService.get<string>('services.inventoryGrpcUrl')
					}
				})
			}
		])
	],
	controllers: [ProductsController],
	providers: [ProductsService, ProductsCacheService],
	exports: [ProductsService, ProductsCacheService]
})
export class ProductsModule {}
