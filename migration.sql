-- =============================================================================
-- Migrações idempotentes (sempre aplicadas pelo serviço `migrate` no Docker).
-- O init.sql só corre no *primeiro* arranque com volume MySQL vazio; este ficheiro
-- alinha bases antigas e reflete alterações incrementais versionadas no repositório.
-- =============================================================================
USE multi_tenant;

DELIMITER $$

DROP PROCEDURE IF EXISTS multi_tenant_apply_soft_delete_migration$$

CREATE PROCEDURE multi_tenant_apply_soft_delete_migration()
BEGIN
  DECLARE sch VARCHAR(64);
  SET sch = DATABASE();

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'deleted_at') THEN
    ALTER TABLE consultations ADD COLUMN deleted_at DATETIME(3) NULL COMMENT 'Soft delete' AFTER updated_at;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'medical_records' AND COLUMN_NAME = 'deleted_at') THEN
    ALTER TABLE medical_records ADD COLUMN deleted_at DATETIME(3) NULL COMMENT 'Soft delete' AFTER updated_at;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'medical_record_entries' AND COLUMN_NAME = 'deleted_at') THEN
    ALTER TABLE medical_record_entries ADD COLUMN deleted_at DATETIME(3) NULL COMMENT 'Soft delete' AFTER created_at;
  END IF;

  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'medical_records' AND INDEX_NAME = 'uq_medical_records_tenant_patient') THEN
    ALTER TABLE medical_records DROP INDEX uq_medical_records_tenant_patient;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'medical_records' AND INDEX_NAME = 'ix_medical_records_tenant_patient') THEN
    CREATE INDEX ix_medical_records_tenant_patient ON medical_records (tenant_id, patient_id);
  END IF;
END$$

DELIMITER ;

CALL multi_tenant_apply_soft_delete_migration();

DROP PROCEDURE IF EXISTS multi_tenant_apply_soft_delete_migration;

-- -----------------------------------------------------------------------------
-- tenants.created_by_user_id + triggers MRE (autor pode ser de outro tenant)
-- -----------------------------------------------------------------------------
DELIMITER $$

DROP PROCEDURE IF EXISTS multi_tenant_apply_tenant_created_by$$

CREATE PROCEDURE multi_tenant_apply_tenant_created_by()
BEGIN
  DECLARE sch VARCHAR(64);
  SET sch = DATABASE();

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'created_by_user_id') THEN
    ALTER TABLE tenants ADD COLUMN created_by_user_id CHAR(36) NULL COMMENT 'Quem criou o tenant' AFTER metadata;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'tenants' AND INDEX_NAME = 'ix_tenants_created_by') THEN
    CREATE INDEX ix_tenants_created_by ON tenants (created_by_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = sch AND TABLE_NAME = 'tenants' AND CONSTRAINT_NAME = 'fk_tenants_created_by_user'
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT fk_tenants_created_by_user
      FOREIGN KEY (created_by_user_id) REFERENCES users (id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$

DELIMITER ;

CALL multi_tenant_apply_tenant_created_by();

DROP PROCEDURE IF EXISTS multi_tenant_apply_tenant_created_by;

DROP TRIGGER IF EXISTS tr_mre_bi;
DROP TRIGGER IF EXISTS tr_mre_bu;

DELIMITER $$

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
    SELECT 1 FROM users u WHERE u.id = NEW.author_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: author_id inválido';
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
    SELECT 1 FROM users u WHERE u.id = NEW.author_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'medical_record_entries: author_id inválido';
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
