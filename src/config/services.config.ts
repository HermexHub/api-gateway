import { registerAs } from '@nestjs/config'

export interface ServicesConfig {
	orderGrpcUrl: string
}

export default registerAs(
	'services',
	(): ServicesConfig => ({
		orderGrpcUrl: process.env.ORDER_GRPC_URL!
	})
)
