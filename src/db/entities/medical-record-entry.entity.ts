import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Consultation } from './consultation.entity';
import { MedicalRecord } from './medical-record.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('medical_record_entries')
@Index('ix_mre_tenant_record', ['tenantId', 'medicalRecordId'])
@Index('ix_mre_consultation', ['tenantId', 'consultationId'])
@Index('ix_mre_author', ['tenantId', 'authorId'])
export class MedicalRecordEntry {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36 })
  tenantId!: string;

  @Column({ name: 'medical_record_id', type: 'char', length: 36 })
  medicalRecordId!: string;

  @Column({ name: 'consultation_id', type: 'char', length: 36, nullable: true })
  consultationId!: string | null;

  @Column({ name: 'author_id', type: 'char', length: 36 })
  authorId!: string;

  @Column({ name: 'entry_type', type: 'varchar', length: 40, default: 'progress' })
  entryType!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title!: string | null;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({
    name: 'recorded_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  recordedAt!: Date;

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.medicalRecordEntries, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  tenant!: Tenant;

  @ManyToOne(() => MedicalRecord, (record) => record.entries, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id', referencedColumnName: 'id' })
  medicalRecord!: MedicalRecord;

  @ManyToOne(() => Consultation, (consultation) => consultation.medicalRecordEntries, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'consultation_id', referencedColumnName: 'id' })
  consultation!: Consultation | null;

  @ManyToOne(() => User, (user) => user.medicalRecordEntriesAsAuthor, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author!: User;
}
