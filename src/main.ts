import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { HermexLogger } from '@hermex/core'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { MetricsService } from './modules/metrics/metrics.service'

async function bootstrap() {
	const hermexLogger = new HermexLogger({ serviceName: 'api-gateway' })
	const app = await NestFactory.create(AppModule, {
		logger: hermexLogger
	})
	app.useLogger(hermexLogger)
	const logger = new Logger('Bootstrap')

	const configService = app.get(ConfigService)
	const port = configService.get<number>('app.port') || 4000
	const nodeEnv = configService.get<string>('app.nodeEnv') || 'development'

	app.use(cookieParser())

	app.setGlobalPrefix('api/v1', {
		exclude: ['health', 'metrics', 'docs', 'docs/*path']
	})

	const metricsService = app.get(MetricsService)

	app.useGlobalFilters(new GlobalExceptionFilter())
	app.useGlobalInterceptors(new LoggingInterceptor(metricsService))
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true
		})
	)

	app.enableCors({
		origin: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
		exposedHeaders: ['x-correlation-id']
	})

	// Swagger documentation setup
	const swaggerConfig = new DocumentBuilder()
		.setTitle('Hermex API Gateway')
		.setDescription(
			'Hermex E-Commerce & Delivery Hub Gateway API documentation'
		)
		.setVersion('1.0')
		.addBearerAuth()
		.addTag('Authentication', 'User registration, login, token refresh and logout')
		.addTag('Orders', 'Order placement and tracking via gRPC Order Service')
		.addTag('Health', 'Service health check and kubernetes probes')
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true
		}
	})

	app.enableShutdownHooks()

	await app.listen(port)
	logger.log(`🚀 API Gateway is running on: http://localhost:${port}`)
	logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`)
	logger.log(`🌍 Environment: ${nodeEnv}`)
}

bootstrap()
