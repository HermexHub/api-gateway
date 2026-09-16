import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfileEntity } from '../entities/user-profile.entity'
import { UserEntity } from '../entities/user.entity'

@Injectable()
export class UserRepository {
	constructor(
		@InjectRepository(UserEntity)
		private readonly repo: Repository<UserEntity>
	) {}

	async findByEmail(email: string): Promise<UserEntity | null> {
		return this.repo.findOne({
			where: { email: email.trim().toLowerCase() },
			relations: ['profile']
		})
	}

	async findById(id: string): Promise<UserEntity | null> {
		return this.repo.findOne({
			where: { id },
			relations: ['profile']
		})
	}

	async createWithProfile(
		userData: {
			email: string
			passwordHash: string
			role?: string
		},
		profileData?: {
			displayName?: string
			firstName?: string
			lastName?: string
			avatarUrl?: string
			phone?: string
		}
	): Promise<UserEntity> {
		const user = this.repo.create({
			email: userData.email.trim().toLowerCase(),
			passwordHash: userData.passwordHash,
			role: userData.role || 'user',
			isActive: true
		})

		const profile = new UserProfileEntity()
		profile.displayName = profileData?.displayName
		profile.firstName = profileData?.firstName
		profile.lastName = profileData?.lastName
		profile.avatarUrl = profileData?.avatarUrl
		profile.phone = profileData?.phone

		user.profile = profile

		return this.repo.save(user)
	}

	async incrementTokenVersion(id: string): Promise<number> {
		const result = await this.repo
			.createQueryBuilder()
			.update(UserEntity)
			.set({
				tokenVersion: () =>
					'CASE WHEN token_version >= 2147483647 THEN 1 ELSE token_version + 1 END'
			})
			.where('id = :id', { id })
			.returning('token_version')
			.execute()

		return Number(result.raw[0]?.token_version ?? 1)
	}
}


