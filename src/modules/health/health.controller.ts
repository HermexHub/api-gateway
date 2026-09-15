import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { ApiHealthCheck } from './docs/health.swagger'
import { HealthCheckResult, HealthService } from './health.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Public()
	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiHealthCheck()
	check(): HealthCheckResult {
		return this.healthService.check()
	}
}

