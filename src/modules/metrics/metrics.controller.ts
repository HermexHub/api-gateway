import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { MetricsService } from './metrics.service'

@ApiTags('Observability')
@Controller('metrics')
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Public()
	@Get()
	@HttpCode(HttpStatus.OK)
	@Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
	@ApiExcludeEndpoint()
	async getMetrics(): Promise<string> {
		return this.metricsService.getMetrics()
	}
}
