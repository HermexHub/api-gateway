import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

async function bootstrap() {
	const logger = new Logger('Bootstrap')
	const app = await NestFactory.create(AppModule)

	const configService = app.get(ConfigService)
	const port = configService.get<number>('app.port') || 4000
	const nodeEnv = configService.get<string>('app.nodeEnv') || 'development'

	app.use(cookieParser())

	app.setGlobalPrefix('api/v1', {
		exclude: ['health', 'docs', 'docs/*path']
	})

	app.useGlobalFilters(new GlobalExceptionFilter())
	app.useGlobalInterceptors(new LoggingInterceptor())
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
		.addTag('Health', 'Service health check and kubernetes probes')
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true
		}
	})

	await app.listen(port)
	logger.log(`🚀 API Gateway is running on: http://localhost:${port}`)
	logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`)
	logger.log(`🩺 Health check endpoint: http://localhost:${port}/health`)
	logger.log(`🌍 Environment: ${nodeEnv}`)
}

bootstrap()
