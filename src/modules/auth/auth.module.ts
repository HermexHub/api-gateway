import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserProfileEntity } from './entities/user-profile.entity'
import { UserEntity } from './entities/user.entity'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { UserProfileRepository } from './repositories/user-profile.repository'
import { UserRepository } from './repositories/user.repository'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			UserEntity,
			UserProfileEntity
		]),
		JwtModule.register({})
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		JwtAuthGuard,
		UserRepository,
		UserProfileRepository
	],
	exports: [
		AuthService,
		JwtAuthGuard,
		UserRepository,
		UserProfileRepository,
		JwtModule
	]
})
export class AuthModule {}

