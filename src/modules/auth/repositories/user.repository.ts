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

	async incrementTokenVersion(id: string): Promise<void> {
		await this.repo.increment({ id }, 'tokenVersion', 1)
	}
}

