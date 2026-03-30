import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { Consultation } from './consultation.entity';
import { MedicalRecord } from './medical-record.entity';
import { Tenant } from './tenant.entity';

@Entity('patients')
@Index('uq_patients_tenant_internal', ['tenantId', 'internalCode'], {
  unique: true,
})
@Index('ix_patients_tenant_name', ['tenantId', 'fullName'])
@Index('ix_patients_tenant_document', ['tenantId', 'documentId'])
@Index('ix_patients_tenant_deleted', ['tenantId', 'deletedAt'])
export class Patient {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36 })
  tenantId!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName!: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender!: string | null;

  @Column({ name: 'document_id', type: 'varchar', length: 32, nullable: true })
  documentId!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'address_line', type: 'varchar', length: 255, nullable: true })
  addressLine!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  state!: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ name: 'internal_code', type: 'varchar', length: 64, nullable: true })
  internalCode!: string | null;

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  deletedAt!: Date | null;

  @ManyToOne(() => Tenant, (tenant) => tenant.patients, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
  tenant!: Tenant;

  @OneToMany(() => Consultation, (consultation) => consultation.patient)
  consultations!: Consultation[];

  @OneToOne(() => MedicalRecord, (record) => record.patient)
  medicalRecord!: MedicalRecord | null;
}
