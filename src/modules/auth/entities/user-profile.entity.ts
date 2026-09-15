import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'
import { UserEntity } from './user.entity'

@Entity('user_profiles')
export class UserProfileEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ name: 'user_id', type: 'uuid', unique: true })
	userId!: string

	@OneToOne(() => UserEntity, user => user.profile, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity

	@Column({
		name: 'first_name',
		type: 'varchar',
		length: 100,
		nullable: true
	})
	firstName?: string

	@Column({
		name: 'last_name',
		type: 'varchar',
		length: 100,
		nullable: true
	})
	lastName?: string

	@Column({
		name: 'display_name',
		type: 'varchar',
		length: 100,
		nullable: true
	})
	displayName?: string

	@Column({
		name: 'avatar_url',
		type: 'varchar',
		length: 500,
		nullable: true
	})
	avatarUrl?: string

	@Column({ type: 'varchar', length: 30, nullable: true })
	phone?: string

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date
}
