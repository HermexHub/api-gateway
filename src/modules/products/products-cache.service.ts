import {
	Injectable,
	Logger,
	OnApplicationShutdown,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { GetProductsQueryDto } from './dto/get-products-query.dto'

@Injectable()
export class ProductsCacheService
	implements OnModuleInit, OnApplicationShutdown
{
	private readonly logger = new Logger(ProductsCacheService.name)
	private redis!: Redis
	private isConnected = false
	private inFlightPromises = new Map<string, Promise<any>>()

	constructor(private readonly configService: ConfigService) {}

	onModuleInit(): void {
		const host = this.configService.get<string>('REDIS_HOST')!
		const port = Number(this.configService.get<number>('REDIS_PORT'))!
		const password = this.configService.get<string>('REDIS_PASSWORD')

		this.redis = new Redis({
			host,
			port,
			password: password || undefined,
			lazyConnect: true,
			maxRetriesPerRequest: 1,
			enableOfflineQueue: false,
			retryStrategy(times) {
				return Math.min(times * 100, 3000)
			}
		})

		this.redis.on('connect', () => {
			this.isConnected = true
			this.logger.log(`✅ Connected to Redis cache at ${host}:${port}`)
		})

		this.redis.on('error', (err) => {
			this.isConnected = false
			this.logger.warn(
				`⚠️ Redis cache connection warning (${host}:${port}): ${err.message}`
			)
		})

		this.redis.connect().catch((err) => {
			this.logger.warn(`Redis initial connection deferred: ${err.message}`)
		})
	}

	async onApplicationShutdown(): Promise<void> {
		if (this.redis) {
			try {
				await this.redis.quit()
				this.logger.log('Redis cache connection closed gracefully')
			} catch {
				this.redis.disconnect()
			}
		}
	}

	/**
	 * Build canonical cache key for catalog queries
	 */
	buildCatalogKey(query: GetProductsQueryDto): string {
		const page = query.page || 1
		const limit = query.limit || 20
		const inStockOnly = !!query.inStockOnly
		const search = (query.search || '').trim().toLowerCase()
		const sortBy = query.sortBy || 'createdAt'
		const sortOrder = (query.sortOrder || 'DESC').toUpperCase()

		// Fast-path key for default landing page (page 1, 20 items, default sort)
		if (
			page === 1 &&
			limit === 20 &&
			!inStockOnly &&
			!search &&
			sortBy === 'createdAt' &&
			sortOrder === 'DESC'
		) {
			return 'hermex:catalog:page:1:default'
		}

		return `hermex:catalog:p${page}_l${limit}_s${sortBy}_o${sortOrder}_stk${inStockOnly}_q${encodeURIComponent(search)}`
	}

	/**
	 * Build cache key for individual product details
	 */
	buildProductKey(id: string): string {
		return `hermex:catalog:product:${id}`
	}

	/**
	 * Retrieve cached string or null if miss or error
	 */
	async get<T>(key: string): Promise<T | null> {
		if (!this.isConnected) {
			return null
		}
		try {
			const data = await this.redis.get(key)
			if (!data) return null
			return JSON.parse(data) as T
		} catch (error) {
			this.logger.warn(`Redis GET failed for key '${key}': ${(error as Error).message}`)
			return null
		}
	}

	/**
	 * Store item in Redis with TTL in seconds
	 */
	async set(key: string, value: any, ttlSeconds: number): Promise<void> {
		if (!this.isConnected) {
			return
		}
		try {
			const serialized = JSON.stringify(value)
			await this.redis.set(key, serialized, 'EX', ttlSeconds)
		} catch (error) {
			this.logger.warn(`Redis SET failed for key '${key}': ${(error as Error).message}`)
		}
	}

	/**
	 * Cache Stampede Protection (Singleflight):
	 * Ensures that concurrent identical requests share a single execution promise
	 */
	async getOrSet<T>(
		key: string,
		ttlSeconds: number,
		factory: () => Promise<T>
	): Promise<T> {
		const cached = await this.get<T>(key)
		if (cached !== null) {
			return cached
		}

		if (this.inFlightPromises.has(key)) {
			return this.inFlightPromises.get(key) as Promise<T>
		}

		const promise = (async () => {
			try {
				const freshData = await factory()
				if (freshData !== null && freshData !== undefined) {
					await this.set(key, freshData, ttlSeconds)
				}
				return freshData
			} finally {
				this.inFlightPromises.delete(key)
			}
		})()

		this.inFlightPromises.set(key, promise)
		return promise
	}

	/**
	 * Invalidate single key or pattern
	 */
	async del(key: string): Promise<void> {
		if (!this.isConnected) return
		try {
			await this.redis.del(key)
		} catch (error) {
			this.logger.warn(`Redis DEL failed for key '${key}': ${(error as Error).message}`)
		}
	}
}
