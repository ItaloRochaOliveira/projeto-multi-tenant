-- =============================================================================
-- Multi-tenant saúde (MySQL 8+)
-- Tenant = clínica / hospital. Isolamento forte: todo dado clínico exige tenant_id.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Tenants (instituições atendidas pelo mesmo sistema)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS medical_record_entries;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE tenants (
  id            CHAR(36)     NOT NULL,
  name          VARCHAR(160) NOT NULL COMMENT 'Nome fantasia',
  legal_name    VARCHAR(200) NULL COMMENT 'Razão social',
  slug          VARCHAR(80)  NOT NULL COMMENT 'Identificador único na URL/config',
  document      VARCHAR(20)  NULL COMMENT 'CNPJ ou identificador fiscal (opcional)',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  metadata      JSON         NULL COMMENT 'Configurações por tenant (timezone, branding, etc.)',
  created_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_slug (slug),
  KEY ix_tenants_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clínica / hospital (tenant)';

-- -----------------------------------------------------------------------------
-- Usuários do sistema (equipe) — sempre vinculados a um tenant
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id            CHAR(36)     NOT NULL,
  tenant_id     CHAR(36)     NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'Hash gerado na aplicação (nunca texto puro)',
  full_name     VARCHAR(200) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'staff' COMMENT 'Ex.: admin, doctor, reception',
  professional_registry VARCHAR(50) NULL COMMENT 'CRM, COREN, etc.',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at    DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  KEY ix_users_tenant (tenant_id),
  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Profissionais e staff; escopo por tenant';

-- -----------------------------------------------------------------------------
-- Pacientes — dados sensíveis; linha sempre pertence a um único tenant
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
  id              CHAR(36)     NOT NULL,
  tenant_id       CHAR(36)     NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  birth_date      DATE         NULL,
  gender          VARCHAR(20)  NULL COMMENT 'Ex.: male, female, other, unknown',
  document_id     VARCHAR(32)  NULL COMMENT 'CPF/RG — criptografar/mascarar na aplicação',
  phone           VARCHAR(40)  NULL,
  email           VARCHAR(255) NULL,
  address_line    VARCHAR(255) NULL,
  city            VARCHAR(120) NULL,
  state           VARCHAR(60)  NULL,
  postal_code     VARCHAR(20)  NULL,
  internal_code   VARCHAR(64)  NULL COMMENT 'Código interno da instituição',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at      DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE (UTC_TIMESTAMP(3)),
  deleted_at      DATETIME(3)  NULL COMMENT 'Soft delete para auditoria',
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_tenant_internal (tenant_id, internal_code),
  KEY ix_patients_tenant_name (tenant_id, full_name),
  KEY ix_patients_tenant_document (tenant_id, document_id),
  KEY ix_patients_tenant_deleted (tenant_id, deleted_at),
  CONSTRAINT fk_patients_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Paciente isolado por tenant (mesma pessoa física = registros distintos por clínica)';

-- -----------------------------------------------------------------------------
-- Consultas / atendimentos
-- -----------------------------------------------------------------------------
CREATE TABLE consultations (
  id                CHAR(36)     NOT NULL,
  tenant_id         CHAR(36)     NOT NULL,
  patient_id        CHAR(36)     NOT NULL,
  practitioner_id   CHAR(36)     NULL COMMENT 'users.id do profissional responsável',
  scheduled_at      DATETIME(3)  NULL,
  started_at        DATETIME(3)  NULL,
  ended_at          DATETIME(3)  NULL,
  status            VARCHAR(30)  NOT NULL DEFAULT 'scheduled'
                    COMMENT 'scheduled, checked_in, in_progress, completed, cancelled, no_show',
  chief_complaint   VARCHAR(500) NULL COMMENT 'Queixa principal',
  notes             TEXT         NULL COMMENT 'Evolução resumida; PHI',
  created_at        DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at        DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  KEY ix_consultations_tenant_scheduled (tenant_id, scheduled_at),
  KEY ix_consultations_tenant_patient (tenant_id, patient_id),
  KEY ix_consultations_practitioner (tenant_id, practitioner_id),
  CONSTRAINT fk_consultations_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_consultations_patient
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_consultations_practitioner
    FOREIGN KEY (practitioner_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Consulta vinculada a paciente e tenant';

-- -----------------------------------------------------------------------------
-- Prontuário (cabeçalho agregado por paciente no tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE medical_records (
  id           CHAR(36)    NOT NULL,
  tenant_id    CHAR(36)    NOT NULL,
  patient_id   CHAR(36)    NOT NULL,
  blood_type   VARCHAR(10) NULL,
  allergies    TEXT        NULL COMMENT 'Alergias conhecidas; PHI',
  chronic_conditions TEXT NULL,
  opened_at    DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_medical_records_tenant_patient (tenant_id, patient_id),
  KEY ix_medical_records_tenant (tenant_id),
  CONSTRAINT fk_medical_records_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_medical_records_patient
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Prontuário lógico: um por paciente dentro do tenant';

-- -----------------------------------------------------------------------------
-- Entradas do prontuário (evoluções, laudos resumidos, ligadas opcionalmente à consulta)
-- -----------------------------------------------------------------------------
CREATE TABLE medical_record_entries (
  id                 CHAR(36)    NOT NULL,
  tenant_id          CHAR(36)    NOT NULL,
  medical_record_id  CHAR(36)    NOT NULL,
  consultation_id    CHAR(36)    NULL,
  author_id          CHAR(36)    NOT NULL COMMENT 'users.id',
  entry_type         VARCHAR(40) NOT NULL DEFAULT 'progress'
                     COMMENT 'progress, exam, prescription_ref, attachment_meta',
  title              VARCHAR(200) NULL,
  content            LONGTEXT    NOT NULL COMMENT 'Texto clínico; PHI',
  recorded_at        DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  created_at         DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  KEY ix_mre_tenant_record (tenant_id, medical_record_id),
  KEY ix_mre_consultation (tenant_id, consultation_id),
  KEY ix_mre_author (tenant_id, author_id),
  CONSTRAINT fk_mre_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mre_medical_record
    FOREIGN KEY (medical_record_id) REFERENCES medical_records (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mre_consultation
    FOREIGN KEY (consultation_id) REFERENCES consultations (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mre_author
    FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Linha do tempo clínica; sempre com tenant_id explícito';

-- =============================================================================
-- Integridade cross-tenant: paciente / consulta / prontuário devem coincidir
-- =============================================================================

DELIMITER $$

CREATE TRIGGER tr_consultations_bi
BEFORE INSERT ON consultations
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = NEW.patient_id AND p.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'consultations: patient_id não pertence ao tenant_id informado';
  END IF;
  IF NEW.practitioner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = NEW.practitioner_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'consultations: practitioner_id não pertence ao tenant_id informado';
  END IF;
END$$

CREATE TRIGGER tr_consultations_bu
BEFORE UPDATE ON consultations
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = NEW.patient_id AND p.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'consultations: patient_id não pertence ao tenant_id informado';
  END IF;
  IF NEW.practitioner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = NEW.practitioner_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'consultations: practitioner_id não pertence ao tenant_id informado';
  END IF;
END$$

CREATE TRIGGER tr_medical_records_bi
BEFORE INSERT ON medical_records
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = NEW.patient_id AND p.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_records: patient_id não pertence ao tenant_id informado';
  END IF;
END$$

CREATE TRIGGER tr_medical_records_bu
BEFORE UPDATE ON medical_records
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = NEW.patient_id AND p.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_records: patient_id não pertence ao tenant_id informado';
  END IF;
END$$

CREATE TRIGGER tr_mre_bi
BEFORE INSERT ON medical_record_entries
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM medical_records mr
    WHERE mr.id = NEW.medical_record_id AND mr.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: medical_record_id não pertence ao tenant_id';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = NEW.author_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: author_id não pertence ao tenant_id';
  END IF;
  IF NEW.consultation_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = NEW.consultation_id AND c.tenant_id = NEW.tenant_id
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'medical_record_entries: consultation_id não pertence ao tenant_id';
    END IF;
  END IF;
END$$

CREATE TRIGGER tr_mre_bu
BEFORE UPDATE ON medical_record_entries
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM medical_records mr
    WHERE mr.id = NEW.medical_record_id AND mr.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: medical_record_id não pertence ao tenant_id';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = NEW.author_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: author_id não pertence ao tenant_id';
  END IF;
  IF NEW.consultation_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = NEW.consultation_id AND c.tenant_id = NEW.tenant_id
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'medical_record_entries: consultation_id não pertence ao tenant_id';
    END IF;
  END IF;
END$$

DELIMITER ;

-- =============================================================================
-- Dados de exemplo (remova em produção ou use apenas em dev)
-- =============================================================================
-- Substitua os UUIDs se preferir gerar na aplicação.
/*
INSERT INTO tenants (id, name, legal_name, slug, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Clínica Exemplo', 'Clínica Exemplo LTDA', 'clinica-exemplo', 1);

INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'admin@clinica.local', '$2a$10$PLACEHOLDER_HASH_NOT_FOR_PRODUCTION', 'Admin Sistema', 'admin', 1);
*/
