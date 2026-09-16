import { registerAs } from '@nestjs/config'

export interface ServicesConfig {
	orderGrpcUrl: string
	paymentGrpcUrl: string
}

export default registerAs(
	'services',
	(): ServicesConfig => ({
		orderGrpcUrl: process.env.ORDER_GRPC_URL!,
		paymentGrpcUrl: process.env.PAYMENT_GRPC_URL || 'localhost:50052'
	})
)

