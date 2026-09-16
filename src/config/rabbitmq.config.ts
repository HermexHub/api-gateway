import { registerAs } from '@nestjs/config'

export interface RabbitMQConfig {
	url: string
}

export default registerAs(
	'rabbitmq',
	(): RabbitMQConfig => ({
		url: process.env.RABBITMQ_URL!
	})
)
