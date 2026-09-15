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
		port: Number(process.env.PORT),
		nodeEnv: process.env.NODE_ENV!,
		jwt: {
			accessSecret: process.env.JWT_ACCESS_SECRET!,
			accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN!,
			refreshSecret: process.env.JWT_REFRESH_SECRET!,
			refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!
		}
	})
)
