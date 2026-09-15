import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm'
import { UserEntity } from './user.entity'

@Entity('refresh_tokens')
export class RefreshTokenEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string

	@ManyToOne(() => UserEntity, user => user.refreshTokens, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity

	@Index()
	@Column({ name: 'token_hash', type: 'varchar', length: 255 })
	tokenHash!: string

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt!: Date

	@Column({ name: 'is_revoked', type: 'boolean', default: false })
	isRevoked!: boolean

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date
}
