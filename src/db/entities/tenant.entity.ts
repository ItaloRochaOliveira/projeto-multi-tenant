import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { Consultation } from './consultation.entity';
import { MedicalRecord } from './medical-record.entity';
import { MedicalRecordEntry } from './medical-record-entry.entity';
import { Patient } from './patient.entity';
import { User } from './user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legalName!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document!: string | null;

  @Index('ix_tenants_active')
  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

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

  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];

  @OneToMany(() => Patient, (patient) => patient.tenant)
  patients!: Patient[];

  @OneToMany(() => Consultation, (consultation) => consultation.tenant)
  consultations!: Consultation[];

  @OneToMany(() => MedicalRecord, (record) => record.tenant)
  medicalRecords!: MedicalRecord[];

  @OneToMany(() => MedicalRecordEntry, (entry) => entry.tenant)
  medicalRecordEntries!: MedicalRecordEntry[];
}
