import { Injectable } from '@nestjs/common'
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class MetricsService {
	private readonly registry: Registry

	public readonly httpRequestsTotal: Counter<string>
	public readonly httpRequestDuration: Histogram<string>
	public readonly sseActiveConnections: Gauge<string>

	constructor() {
		this.registry = new Registry()

		// Collect Node.js and system metrics with 'hermex_' prefix
		collectDefaultMetrics({
			register: this.registry,
			prefix: 'hermex_'
		})

		this.httpRequestsTotal = new Counter({
			name: 'hermex_http_requests_total',
			help: 'Total number of HTTP requests processed by API Gateway',
			labelNames: ['method', 'route', 'status_code'],
			registers: [this.registry]
		})

		this.httpRequestDuration = new Histogram({
			name: 'hermex_http_request_duration_seconds',
			help: 'Duration of HTTP requests processed by API Gateway in seconds',
			labelNames: ['method', 'route', 'status_code'],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
			registers: [this.registry]
		})

		this.sseActiveConnections = new Gauge({
			name: 'hermex_sse_active_connections',
			help: 'Total number of active Server-Sent Events (SSE) order stream connections',
			registers: [this.registry]
		})
	}

	recordHttpRequest(
		method: string,
		route: string,
		statusCode: number,
		durationSeconds: number
	): void {
		const labels = {
			method: method.toUpperCase(),
			route: route || 'unknown_route',
			status_code: statusCode.toString()
		}
		this.httpRequestsTotal.inc(labels)
		this.httpRequestDuration.observe(labels, durationSeconds)
	}

	incrementSseConnections(): void {
		this.sseActiveConnections.inc()
	}

	decrementSseConnections(): void {
		this.sseActiveConnections.dec()
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics()
	}

	getContentType(): string {
		return this.registry.contentType
	}
}
