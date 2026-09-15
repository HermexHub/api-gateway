import { Injectable } from '@nestjs/common'

export interface HealthCheckResult {
	status: 'ok'
	timestamp: string
}

@Injectable()
export class HealthService {
	check(): HealthCheckResult {
		return {
			status: 'ok',
			timestamp: new Date().toISOString()
		}
	}
}
