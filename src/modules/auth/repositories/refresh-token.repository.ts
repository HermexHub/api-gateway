import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'

@Injectable()
export class RefreshTokenRepository {
	constructor(
		@InjectRepository(RefreshTokenEntity)
		private readonly repo: Repository<RefreshTokenEntity>
	) {}

	async createToken(
		userId: string,
		tokenHash: string,
		expiresAt: Date
	): Promise<RefreshTokenEntity> {
		const token = this.repo.create({
			userId,
			tokenHash,
			expiresAt,
			isRevoked: false
		})
		return this.repo.save(token)
	}

	async findValidToken(
		userId: string,
		tokenHash: string
	): Promise<RefreshTokenEntity | null> {
		return this.repo.findOne({
			where: {
				userId,
				tokenHash,
				isRevoked: false,
				expiresAt: MoreThan(new Date())
			}
		})
	}

	async revokeToken(tokenHash: string): Promise<void> {
		await this.repo.update({ tokenHash }, { isRevoked: true })
	}

	async revokeAllUserTokens(userId: string): Promise<void> {
		await this.repo.update({ userId }, { isRevoked: true })
	}
}
