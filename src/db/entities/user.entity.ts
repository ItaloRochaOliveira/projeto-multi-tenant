import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { Consultation } from './consultation.entity';
import { MedicalRecordEntry } from './medical-record-entry.entity';
import { Tenant } from './tenant.entity';

@Entity('users')
@Index('uq_users_tenant_email', ['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName!: string;

  @Column({ type: 'varchar', length: 50, default: 'staff' })
  role!: string;

  @Column({
    name: 'professional_registry',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  professionalRegistry!: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  tenant!: Tenant;

  @OneToMany(() => Consultation, (consultation) => consultation.practitioner)
  consultationsAsPractitioner!: Consultation[];

  @OneToMany(() => MedicalRecordEntry, (entry) => entry.author)
  medicalRecordEntriesAsAuthor!: MedicalRecordEntry[];
}
