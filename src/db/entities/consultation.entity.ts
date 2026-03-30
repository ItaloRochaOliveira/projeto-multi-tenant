import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { MedicalRecordEntry } from './medical-record-entry.entity';
import { Patient } from './patient.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('consultations')
@Index('ix_consultations_tenant_scheduled', ['tenantId', 'scheduledAt'])
@Index('ix_consultations_tenant_patient', ['tenantId', 'patientId'])
@Index('ix_consultations_practitioner', ['tenantId', 'practitionerId'])
export class Consultation {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36 })
  tenantId!: string;

  @Column({ name: 'patient_id', type: 'char', length: 36 })
  patientId!: string;

  @Column({ name: 'practitioner_id', type: 'char', length: 36, nullable: true })
  practitionerId!: string | null;

  @Column({ name: 'scheduled_at', type: 'datetime', precision: 3, nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'started_at', type: 'datetime', precision: 3, nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'datetime', precision: 3, nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'varchar', length: 30, default: 'scheduled' })
  status!: string;

  @Column({ name: 'chief_complaint', type: 'varchar', length: 500, nullable: true })
  chiefComplaint!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

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

  @ManyToOne(() => Tenant, (tenant) => tenant.consultations, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  tenant!: Tenant;

  @ManyToOne(() => Patient, (patient) => patient.consultations, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
  patient!: Patient;

  @ManyToOne(() => User, (user) => user.consultationsAsPractitioner, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'practitioner_id', referencedColumnName: 'id' })
  practitioner!: User | null;

  @OneToMany(() => MedicalRecordEntry, (entry) => entry.consultation)
  medicalRecordEntries!: MedicalRecordEntry[];
}
