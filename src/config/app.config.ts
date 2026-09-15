import { registerAs } from '@nestjs/config'

export interface AppConfig {
	port: number
	nodeEnv: string
	jwt: {
		accessSecret: string
		accessExpiresIn: string
		refreshSecret: string
		refreshExpiresIn: string
	}
}

export default registerAs(
	'app',
	(): AppConfig => ({
		port: parseInt(process.env.PORT || '4000', 10),
		nodeEnv: process.env.NODE_ENV || 'development',
		jwt: {
			accessSecret:
				process.env.JWT_ACCESS_SECRET ||
				'hermex-access-secret-key-change-in-prod',
			accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
			refreshSecret:
				process.env.JWT_REFRESH_SECRET ||
				'hermex-refresh-secret-key-change-in-prod',
			refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
		}
	})
)
