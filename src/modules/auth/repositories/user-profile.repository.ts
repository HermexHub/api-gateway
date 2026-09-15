import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfileEntity } from '../entities/user-profile.entity'

@Injectable()
export class UserProfileRepository {
	constructor(
		@InjectRepository(UserProfileEntity)
		private readonly repo: Repository<UserProfileEntity>
	) {}

	async findByUserId(userId: string): Promise<UserProfileEntity | null> {
		return this.repo.findOne({ where: { userId } })
	}

	async updateByUserId(
		userId: string,
		data: Partial<UserProfileEntity>
	): Promise<UserProfileEntity | null> {
		await this.repo.update({ userId }, data)
		return this.findByUserId(userId)
	}
}
