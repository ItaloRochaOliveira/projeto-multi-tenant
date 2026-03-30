import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { MedicalRecordEntry } from './medical-record-entry.entity';
import { Patient } from './patient.entity';
import { Tenant } from './tenant.entity';

@Entity('medical_records')
@Index('uq_medical_records_tenant_patient', ['tenantId', 'patientId'], {
  unique: true,
})
@Index('ix_medical_records_tenant', ['tenantId'])
export class MedicalRecord {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36 })
  tenantId!: string;

  @Column({ name: 'patient_id', type: 'char', length: 36 })
  patientId!: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType!: string | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ name: 'chronic_conditions', type: 'text', nullable: true })
  chronicConditions!: string | null;

  @Column({
    name: 'opened_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  openedAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.medicalRecords, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  tenant!: Tenant;

  @OneToOne(() => Patient, (patient) => patient.medicalRecord, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
  patient!: Patient;

  @OneToMany(() => MedicalRecordEntry, (entry) => entry.medicalRecord)
  entries!: MedicalRecordEntry[];
}
