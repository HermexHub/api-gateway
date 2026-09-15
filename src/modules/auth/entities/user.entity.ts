import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { RefreshTokenEntity } from './refresh-token.entity'
import { UserProfileEntity } from './user-profile.entity'

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 255, unique: true })
	email!: string

	@Column({ name: 'password_hash', type: 'varchar', length: 255 })
	passwordHash!: string

	@Column({ type: 'varchar', length: 50, default: 'user' })
	role!: string

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean

	@OneToOne(() => UserProfileEntity, profile => profile.user, {
		cascade: true
	})
	profile?: UserProfileEntity

	@OneToMany(() => RefreshTokenEntity, token => token.user)
	refreshTokens?: RefreshTokenEntity[]

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date
}
