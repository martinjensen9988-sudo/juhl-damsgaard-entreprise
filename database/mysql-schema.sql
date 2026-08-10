-- Generated from base44/entities/*.jsonc.
-- This schema keeps entity data flexible during the Base44-to-Simply migration.
-- Run on the Simply MySQL database before switching VITE_API_MODE=simply.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS jd_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 1,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES jd_users(id) ON DELETE CASCADE,
  INDEX idx_jd_sessions_user_id (user_id),
  INDEX idx_jd_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_password_resets (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES jd_users(id) ON DELETE CASCADE,
  INDEX idx_jd_password_resets_user_id (user_id),
  INDEX idx_jd_password_resets_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_account (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_account_created_date (created_date),
  INDEX idx_jd_account_updated_date (updated_date),
  INDEX idx_jd_account_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_activity_log (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_activity_log_created_date (created_date),
  INDEX idx_jd_activity_log_updated_date (updated_date),
  INDEX idx_jd_activity_log_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_app_release (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_app_release_created_date (created_date),
  INDEX idx_jd_app_release_updated_date (updated_date),
  INDEX idx_jd_app_release_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_asbest_fjernelse (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_asbest_fjernelse_created_date (created_date),
  INDEX idx_jd_asbest_fjernelse_updated_date (updated_date),
  INDEX idx_jd_asbest_fjernelse_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_assignment (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_assignment_created_date (created_date),
  INDEX idx_jd_assignment_updated_date (updated_date),
  INDEX idx_jd_assignment_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_budget_item (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_budget_item_created_date (created_date),
  INDEX idx_jd_budget_item_updated_date (updated_date),
  INDEX idx_jd_budget_item_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_campaign (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_campaign_created_date (created_date),
  INDEX idx_jd_campaign_updated_date (updated_date),
  INDEX idx_jd_campaign_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_certificate (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_certificate_created_date (created_date),
  INDEX idx_jd_certificate_updated_date (updated_date),
  INDEX idx_jd_certificate_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_certificate_log (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_certificate_log_created_date (created_date),
  INDEX idx_jd_certificate_log_updated_date (updated_date),
  INDEX idx_jd_certificate_log_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_company_resource (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_company_resource_created_date (created_date),
  INDEX idx_jd_company_resource_updated_date (updated_date),
  INDEX idx_jd_company_resource_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_company_settings (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_company_settings_created_date (created_date),
  INDEX idx_jd_company_settings_updated_date (updated_date),
  INDEX idx_jd_company_settings_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_contact (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_contact_created_date (created_date),
  INDEX idx_jd_contact_updated_date (updated_date),
  INDEX idx_jd_contact_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_customer (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_customer_created_date (created_date),
  INDEX idx_jd_customer_updated_date (updated_date),
  INDEX idx_jd_customer_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_customer_contact_log (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_customer_contact_log_created_date (created_date),
  INDEX idx_jd_customer_contact_log_updated_date (updated_date),
  INDEX idx_jd_customer_contact_log_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_customer_feedback (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_customer_feedback_created_date (created_date),
  INDEX idx_jd_customer_feedback_updated_date (updated_date),
  INDEX idx_jd_customer_feedback_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_customer_reference (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_customer_reference_created_date (created_date),
  INDEX idx_jd_customer_reference_updated_date (updated_date),
  INDEX idx_jd_customer_reference_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_deviation (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_deviation_created_date (created_date),
  INDEX idx_jd_deviation_updated_date (updated_date),
  INDEX idx_jd_deviation_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_employee (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_employee_created_date (created_date),
  INDEX idx_jd_employee_updated_date (updated_date),
  INDEX idx_jd_employee_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_equipment (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_equipment_created_date (created_date),
  INDEX idx_jd_equipment_updated_date (updated_date),
  INDEX idx_jd_equipment_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_equipment_booking (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_equipment_booking_created_date (created_date),
  INDEX idx_jd_equipment_booking_updated_date (updated_date),
  INDEX idx_jd_equipment_booking_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_equipment_maintenance (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_equipment_maintenance_created_date (created_date),
  INDEX idx_jd_equipment_maintenance_updated_date (updated_date),
  INDEX idx_jd_equipment_maintenance_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_expense (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_expense_created_date (created_date),
  INDEX idx_jd_expense_updated_date (updated_date),
  INDEX idx_jd_expense_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_handover (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_handover_created_date (created_date),
  INDEX idx_jd_handover_updated_date (updated_date),
  INDEX idx_jd_handover_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_insurance_case (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_insurance_case_created_date (created_date),
  INDEX idx_jd_insurance_case_updated_date (updated_date),
  INDEX idx_jd_insurance_case_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_internal_message (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_internal_message_created_date (created_date),
  INDEX idx_jd_internal_message_updated_date (updated_date),
  INDEX idx_jd_internal_message_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_inventory_item (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_inventory_item_created_date (created_date),
  INDEX idx_jd_inventory_item_updated_date (updated_date),
  INDEX idx_jd_inventory_item_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_invoice (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_invoice_created_date (created_date),
  INDEX idx_jd_invoice_updated_date (updated_date),
  INDEX idx_jd_invoice_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_journal_entry (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_journal_entry_created_date (created_date),
  INDEX idx_jd_journal_entry_updated_date (updated_date),
  INDEX idx_jd_journal_entry_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_knowledge_article (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_knowledge_article_created_date (created_date),
  INDEX idx_jd_knowledge_article_updated_date (updated_date),
  INDEX idx_jd_knowledge_article_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_lead (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_lead_created_date (created_date),
  INDEX idx_jd_lead_updated_date (updated_date),
  INDEX idx_jd_lead_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_marketing_post (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_marketing_post_created_date (created_date),
  INDEX idx_jd_marketing_post_updated_date (updated_date),
  INDEX idx_jd_marketing_post_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_material (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_material_created_date (created_date),
  INDEX idx_jd_material_updated_date (updated_date),
  INDEX idx_jd_material_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_material_need (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_material_need_created_date (created_date),
  INDEX idx_jd_material_need_updated_date (updated_date),
  INDEX idx_jd_material_need_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_meeting_booking (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_meeting_booking_created_date (created_date),
  INDEX idx_jd_meeting_booking_updated_date (updated_date),
  INDEX idx_jd_meeting_booking_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_milestone (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_milestone_created_date (created_date),
  INDEX idx_jd_milestone_updated_date (updated_date),
  INDEX idx_jd_milestone_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_newsletter (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_newsletter_created_date (created_date),
  INDEX idx_jd_newsletter_updated_date (updated_date),
  INDEX idx_jd_newsletter_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_photo_archive (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_photo_archive_created_date (created_date),
  INDEX idx_jd_photo_archive_updated_date (updated_date),
  INDEX idx_jd_photo_archive_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_portal_setting (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_portal_setting_created_date (created_date),
  INDEX idx_jd_portal_setting_updated_date (updated_date),
  INDEX idx_jd_portal_setting_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_project (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_project_created_date (created_date),
  INDEX idx_jd_project_updated_date (updated_date),
  INDEX idx_jd_project_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_project_document (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_project_document_created_date (created_date),
  INDEX idx_jd_project_document_updated_date (updated_date),
  INDEX idx_jd_project_document_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_project_image (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_project_image_created_date (created_date),
  INDEX idx_jd_project_image_updated_date (updated_date),
  INDEX idx_jd_project_image_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_project_note (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_project_note_created_date (created_date),
  INDEX idx_jd_project_note_updated_date (updated_date),
  INDEX idx_jd_project_note_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_purchase_order (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_purchase_order_created_date (created_date),
  INDEX idx_jd_purchase_order_updated_date (updated_date),
  INDEX idx_jd_purchase_order_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_quality_check (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_quality_check_created_date (created_date),
  INDEX idx_jd_quality_check_updated_date (updated_date),
  INDEX idx_jd_quality_check_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_quote (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_quote_created_date (created_date),
  INDEX idx_jd_quote_updated_date (updated_date),
  INDEX idx_jd_quote_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_quote_template (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_quote_template_created_date (created_date),
  INDEX idx_jd_quote_template_updated_date (updated_date),
  INDEX idx_jd_quote_template_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_safety_checklist (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_safety_checklist_created_date (created_date),
  INDEX idx_jd_safety_checklist_updated_date (updated_date),
  INDEX idx_jd_safety_checklist_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_safety_log (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_safety_log_created_date (created_date),
  INDEX idx_jd_safety_log_updated_date (updated_date),
  INDEX idx_jd_safety_log_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_safety_protocol (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_safety_protocol_created_date (created_date),
  INDEX idx_jd_safety_protocol_updated_date (updated_date),
  INDEX idx_jd_safety_protocol_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_service (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_service_created_date (created_date),
  INDEX idx_jd_service_updated_date (updated_date),
  INDEX idx_jd_service_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_service_agreement (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_service_agreement_created_date (created_date),
  INDEX idx_jd_service_agreement_updated_date (updated_date),
  INDEX idx_jd_service_agreement_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_service_task (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_service_task_created_date (created_date),
  INDEX idx_jd_service_task_updated_date (updated_date),
  INDEX idx_jd_service_task_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_shift (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_shift_created_date (created_date),
  INDEX idx_jd_shift_updated_date (updated_date),
  INDEX idx_jd_shift_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_signature_request (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_signature_request_created_date (created_date),
  INDEX idx_jd_signature_request_updated_date (updated_date),
  INDEX idx_jd_signature_request_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_subcontractor (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_subcontractor_created_date (created_date),
  INDEX idx_jd_subcontractor_updated_date (updated_date),
  INDEX idx_jd_subcontractor_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_subscription (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_subscription_created_date (created_date),
  INDEX idx_jd_subscription_updated_date (updated_date),
  INDEX idx_jd_subscription_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_supplier (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_supplier_created_date (created_date),
  INDEX idx_jd_supplier_updated_date (updated_date),
  INDEX idx_jd_supplier_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_supplier_invoice (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_supplier_invoice_created_date (created_date),
  INDEX idx_jd_supplier_invoice_updated_date (updated_date),
  INDEX idx_jd_supplier_invoice_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_support_ticket (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_support_ticket_created_date (created_date),
  INDEX idx_jd_support_ticket_updated_date (updated_date),
  INDEX idx_jd_support_ticket_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_task (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_task_created_date (created_date),
  INDEX idx_jd_task_updated_date (updated_date),
  INDEX idx_jd_task_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_time_entry (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_time_entry_created_date (created_date),
  INDEX idx_jd_time_entry_updated_date (updated_date),
  INDEX idx_jd_time_entry_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_user (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_user_created_date (created_date),
  INDEX idx_jd_user_updated_date (updated_date),
  INDEX idx_jd_user_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_vacation_request (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_vacation_request_created_date (created_date),
  INDEX idx_jd_vacation_request_updated_date (updated_date),
  INDEX idx_jd_vacation_request_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_vat_report (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_vat_report_created_date (created_date),
  INDEX idx_jd_vat_report_updated_date (updated_date),
  INDEX idx_jd_vat_report_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_vehicle (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_vehicle_created_date (created_date),
  INDEX idx_jd_vehicle_updated_date (updated_date),
  INDEX idx_jd_vehicle_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_waste_log (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_waste_log_created_date (created_date),
  INDEX idx_jd_waste_log_updated_date (updated_date),
  INDEX idx_jd_waste_log_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_website_inquiry (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_website_inquiry_created_date (created_date),
  INDEX idx_jd_website_inquiry_updated_date (updated_date),
  INDEX idx_jd_website_inquiry_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
