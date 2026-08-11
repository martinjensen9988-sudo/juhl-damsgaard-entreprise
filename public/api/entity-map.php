<?php
return [
  "Account" => [
    "table" => "jd_account",
    "required" => [
      "account_number",
      "name"
    ],
    "properties" => [
      "account_number",
      "name",
      "type",
      "vat_code",
      "vat_type",
      "is_active",
      "description"
    ]
  ],
  "ActivityLog" => [
    "table" => "jd_activity_log",
    "required" => [
      "entity_type",
      "action"
    ],
    "properties" => [
      "entity_type",
      "entity_id",
      "entity_name",
      "action",
      "user_email",
      "user_name",
      "details"
    ]
  ],
  "AppRelease" => [
    "table" => "jd_app_release",
    "required" => [
      "platform",
      "file_url"
    ],
    "properties" => [
      "platform",
      "version",
      "file_url",
      "notes"
    ]
  ],
  "AsbestFjernelse" => [
    "table" => "jd_asbest_fjernelse",
    "required" => [
      "title",
      "asbestos_type",
      "status"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "customer_name",
      "address",
      "asbestos_type",
      "location",
      "sample_results",
      "amount",
      "unit",
      "removal_method",
      "disposal_facility",
      "status",
      "start_date",
      "end_date",
      "responsible_person",
      "safety_measures",
      "certificate_number",
      "certificate_url",
      "before_photo_url",
      "after_photo_url",
      "notes"
    ]
  ],
  "Assignment" => [
    "table" => "jd_assignment",
    "required" => [
      "project_id",
      "employee_name",
      "date"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "employee_name",
      "date",
      "notes"
    ]
  ],
  "BudgetItem" => [
    "table" => "jd_budget_item",
    "required" => [
      "name",
      "amount"
    ],
    "properties" => [
      "name",
      "category",
      "amount",
      "frequency",
      "next_due_date",
      "supplier",
      "notes"
    ]
  ],
  "Campaign" => [
    "table" => "jd_campaign",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "channel",
      "start_date",
      "end_date",
      "budget",
      "status",
      "inquiries",
      "quotes_sent",
      "won",
      "notes"
    ]
  ],
  "Certificate" => [
    "table" => "jd_certificate",
    "required" => [
      "title",
      "employee_name"
    ],
    "properties" => [
      "employee_id",
      "employee_name",
      "title",
      "type",
      "issue_date",
      "expiry_date",
      "file_url",
      "notes"
    ]
  ],
  "CertificateLog" => [
    "table" => "jd_certificate_log",
    "required" => [
      "employee_name",
      "certificate_type",
      "expiry_date"
    ],
    "properties" => [
      "employee_name",
      "certificate_type",
      "certificate_number",
      "issue_date",
      "expiry_date",
      "issuer",
      "file_url",
      "status",
      "notes"
    ]
  ],
  "CompanyResource" => [
    "table" => "jd_company_resource",
    "required" => [
      "title",
      "category"
    ],
    "properties" => [
      "title",
      "category",
      "description",
      "file_url",
      "file_name",
      "version",
      "last_updated",
      "access_level",
      "uploaded_by"
    ]
  ],
  "CompanySettings" => [
    "table" => "jd_company_settings",
    "required" => [
      "company_name"
    ],
    "properties" => [
      "company_name",
      "cvr",
      "address",
      "postal_code",
      "city",
      "phone",
      "email",
      "logo_url",
      "vat_rate",
      "vat_enabled",
      "invoice_prefix",
      "quote_prefix",
      "payment_terms",
      "bank_account",
      "accounting_system",
      "accounting_api_key",
      "accounting_org_id",
      "accounting_sync_invoices",
      "accounting_sync_customers"
    ]
  ],
  "Contact" => [
    "table" => "jd_contact",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "company",
      "role",
      "email",
      "phone",
      "category",
      "linked_project_id",
      "linked_project_name",
      "linked_task",
      "notes"
    ]
  ],
  "Customer" => [
    "table" => "jd_customer",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "company",
      "email",
      "phone",
      "address",
      "postal_code",
      "city",
      "latitude",
      "longitude",
      "cvr",
      "payment_terms",
      "notes"
    ]
  ],
  "CustomerContactLog" => [
    "table" => "jd_customer_contact_log",
    "required" => [
      "customer_name",
      "contact_type",
      "date"
    ],
    "properties" => [
      "customer_name",
      "customer_id",
      "project_name",
      "project_id",
      "contact_type",
      "direction",
      "date",
      "subject",
      "summary",
      "handled_by",
      "follow_up",
      "follow_up_date"
    ]
  ],
  "CustomerFeedback" => [
    "table" => "jd_customer_feedback",
    "required" => [
      "customer_name",
      "overall_rating"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "customer_name",
      "customer_email",
      "overall_rating",
      "quality_rating",
      "communication_rating",
      "punctuality_rating",
      "would_recommend",
      "comment",
      "date",
      "status"
    ]
  ],
  "CustomerReference" => [
    "table" => "jd_customer_reference",
    "required" => [
      "title",
      "description"
    ],
    "properties" => [
      "title",
      "customer_name",
      "project_name",
      "project_type",
      "description",
      "photo_urls",
      "main_photo_url",
      "completed_date",
      "location",
      "featured",
      "rating"
    ]
  ],
  "Deviation" => [
    "table" => "jd_deviation",
    "required" => [
      "title",
      "project_id",
      "type",
      "date"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "customer_name",
      "type",
      "severity",
      "status",
      "extra_cost",
      "extra_hours",
      "date",
      "reported_by",
      "description",
      "resolution",
      "photo_url"
    ]
  ],
  "Employee" => [
    "table" => "jd_employee",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "email",
      "phone",
      "address",
      "trade",
      "position",
      "hire_date",
      "hourly_rate",
      "certificates",
      "competencies",
      "responsibilities",
      "status",
      "notes"
    ]
  ],
  "Equipment" => [
    "table" => "jd_equipment",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "category",
      "serial_number",
      "location",
      "status",
      "assigned_to",
      "assigned_project_id",
      "assigned_project_name",
      "condition",
      "purchase_date",
      "notes"
    ]
  ],
  "EquipmentBooking" => [
    "table" => "jd_equipment_booking",
    "required" => [
      "equipment_name",
      "start_date",
      "end_date"
    ],
    "properties" => [
      "equipment_id",
      "equipment_name",
      "project_id",
      "project_name",
      "employee_name",
      "start_date",
      "end_date",
      "status",
      "is_external_rental",
      "renter_name",
      "renter_company",
      "renter_phone",
      "daily_rate",
      "total_price",
      "invoice_number",
      "notes"
    ]
  ],
  "EquipmentMaintenance" => [
    "table" => "jd_equipment_maintenance",
    "required" => [
      "equipment_name",
      "maintenance_type"
    ],
    "properties" => [
      "equipment_name",
      "equipment_type",
      "maintenance_type",
      "last_date",
      "next_date",
      "cost",
      "status",
      "performed_by",
      "mileage_hours",
      "notes"
    ]
  ],
  "Expense" => [
    "table" => "jd_expense",
    "required" => [
      "title",
      "category",
      "amount",
      "date"
    ],
    "properties" => [
      "title",
      "category",
      "amount",
      "date",
      "project_id",
      "project_name",
      "supplier_name",
      "supplier_invoice_id",
      "receipt_url",
      "approval_status",
      "submitted_by",
      "approved_by",
      "approved_date",
      "rejection_reason",
      "recurring",
      "notes"
    ]
  ],
  "Handover" => [
    "table" => "jd_handover",
    "required" => [
      "project_name"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "customer_name",
      "handover_date",
      "status",
      "defects",
      "before_photo_urls",
      "after_photo_urls",
      "signature_url",
      "signed_by",
      "signed_date",
      "inspector",
      "notes"
    ]
  ],
  "InsuranceCase" => [
    "table" => "jd_insurance_case",
    "required" => [
      "case_number"
    ],
    "properties" => [
      "case_number",
      "customer_name",
      "project_name",
      "insurance_company",
      "insurance_contact",
      "insurance_phone",
      "insurance_email",
      "policy_number",
      "damage_type",
      "damage_date",
      "reported_date",
      "address",
      "description",
      "damage_items",
      "before_photo_urls",
      "during_photo_urls",
      "after_photo_urls",
      "report_url",
      "communication_log",
      "status",
      "estimated_amount",
      "approved_amount",
      "deductible",
      "repair_status",
      "repair_start_date",
      "repair_end_date",
      "repair_assigned_to",
      "repair_notes",
      "assigned_to",
      "notes"
    ]
  ],
  "InternalMessage" => [
    "table" => "jd_internal_message",
    "required" => [
      "title",
      "message"
    ],
    "properties" => [
      "title",
      "message",
      "priority",
      "category",
      "author_name",
      "author_email",
      "is_reply",
      "is_broadcast",
      "parent_id",
      "recipient_user_id",
      "active",
      "expires_date"
    ]
  ],
  "InventoryItem" => [
    "table" => "jd_inventory_item",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "category",
      "stock_quantity",
      "min_stock_level",
      "unit",
      "unit_price",
      "location",
      "supplier_name",
      "notes"
    ]
  ],
  "Invoice" => [
    "table" => "jd_invoice",
    "required" => [
      "invoice_number"
    ],
    "properties" => [
      "invoice_number",
      "customer_id",
      "customer_name",
      "customer_email",
      "project_id",
      "project_name",
      "quote_id",
      "status",
      "date",
      "due_date",
      "line_items",
      "paid_amount",
      "reminder_sent",
      "notes"
    ]
  ],
  "JournalEntry" => [
    "table" => "jd_journal_entry",
    "required" => [
      "entry_number",
      "date"
    ],
    "properties" => [
      "entry_number",
      "date",
      "period",
      "description",
      "status",
      "lines",
      "attachment_url",
      "posted_date"
    ]
  ],
  "KnowledgeArticle" => [
    "table" => "jd_knowledge_article",
    "required" => [
      "title",
      "category"
    ],
    "properties" => [
      "title",
      "category",
      "content",
      "tags",
      "author",
      "status",
      "views",
      "helpful_count"
    ]
  ],
  "Lead" => [
    "table" => "jd_lead",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "customer_name",
      "customer_email",
      "customer_phone",
      "source",
      "description",
      "estimated_value",
      "stage",
      "project_type",
      "assigned_to",
      "due_date"
    ]
  ],
  "MarketingPost" => [
    "table" => "jd_marketing_post",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "platform",
      "post_type",
      "content",
      "image_url",
      "planned_date",
      "status",
      "campaign_id",
      "campaign_name",
      "assigned_to",
      "reach",
      "engagement",
      "notes"
    ]
  ],
  "Material" => [
    "table" => "jd_material",
    "required" => [
      "name"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "name",
      "category",
      "quantity",
      "unit",
      "unit_price",
      "supplier_id",
      "supplier_name",
      "ordered"
    ]
  ],
  "MaterialNeed" => [
    "table" => "jd_material_need",
    "required" => [
      "material_name",
      "quantity"
    ],
    "properties" => [
      "material_name",
      "quantity",
      "unit",
      "project_id",
      "project_name",
      "status",
      "priority",
      "estimated_price",
      "needed_by_date",
      "notes"
    ]
  ],
  "MeetingBooking" => [
    "table" => "jd_meeting_booking",
    "required" => [
      "title",
      "customer_name",
      "date"
    ],
    "properties" => [
      "title",
      "customer_name",
      "customer_email",
      "customer_phone",
      "meeting_type",
      "date",
      "time",
      "duration_minutes",
      "address",
      "employee_name",
      "attendees",
      "agenda",
      "minutes",
      "status",
      "notes"
    ]
  ],
  "Milestone" => [
    "table" => "jd_milestone",
    "required" => [
      "title",
      "project_id"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "title",
      "description",
      "due_date",
      "status",
      "completed_date",
      "order"
    ]
  ],
  "Newsletter" => [
    "table" => "jd_newsletter",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "audience",
      "content",
      "planned_date",
      "status",
      "recipients_count",
      "opened",
      "clicked",
      "assigned_to",
      "campaign_id",
      "campaign_name",
      "notes"
    ]
  ],
  "NotificationRead" => [
    "table" => "jd_notification_read",
    "required" => [
      "user_id",
      "item_type",
      "item_id"
    ],
    "properties" => [
      "user_id",
      "item_type",
      "item_id",
      "read_at"
    ]
  ],
  "PhotoArchive" => [
    "table" => "jd_photo_archive",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "description",
      "before_photo_url",
      "after_photo_url",
      "photo_urls",
      "category",
      "uploaded_by",
      "date"
    ]
  ],
  "PortalSetting" => [
    "table" => "jd_portal_setting",
    "required" => [
      "label"
    ],
    "properties" => [
      "label",
      "show_projects",
      "show_project_budget",
      "show_quotes",
      "show_invoices",
      "show_invoice_amounts",
      "show_images",
      "show_documents",
      "show_quality_checks",
      "show_prisberegner",
      "allow_quote_accept",
      "welcome_message",
      "contact_email",
      "contact_phone"
    ]
  ],
  "Project" => [
    "table" => "jd_project",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "customer_id",
      "customer_name",
      "customer_email",
      "description",
      "type",
      "status",
      "start_date",
      "end_date",
      "budget",
      "address",
      "subcontractor_id",
      "subcontractor_name"
    ]
  ],
  "ProjectDocument" => [
    "table" => "jd_project_document",
    "required" => [
      "title",
      "file_url"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "customer_email",
      "title",
      "type",
      "file_url",
      "description",
      "upload_date"
    ]
  ],
  "ProjectImage" => [
    "table" => "jd_project_image",
    "required" => [
      "project_id",
      "image_url"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "customer_email",
      "image_url",
      "caption",
      "phase",
      "upload_date"
    ]
  ],
  "ProjectNote" => [
    "table" => "jd_project_note",
    "required" => [
      "project_id",
      "date",
      "content"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "date",
      "author_name",
      "weather",
      "content",
      "events"
    ]
  ],
  "PurchaseOrder" => [
    "table" => "jd_purchase_order",
    "required" => [
      "order_number"
    ],
    "properties" => [
      "order_number",
      "supplier_id",
      "supplier_name",
      "project_id",
      "project_name",
      "status",
      "items",
      "order_date",
      "expected_date",
      "notes"
    ]
  ],
  "QualityCheck" => [
    "table" => "jd_quality_check",
    "required" => [
      "title"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "customer_email",
      "title",
      "type",
      "status",
      "items",
      "checked_by",
      "check_date",
      "notes"
    ]
  ],
  "Quote" => [
    "table" => "jd_quote",
    "required" => [
      "quote_number"
    ],
    "properties" => [
      "quote_number",
      "customer_id",
      "customer_name",
      "customer_email",
      "project_id",
      "project_name",
      "status",
      "date",
      "valid_until",
      "line_items",
      "notes",
      "viewed_at",
      "accepted_at",
      "accepted_by",
      "accepted_ip"
    ]
  ],
  "QuoteTemplate" => [
    "table" => "jd_quote_template",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "category",
      "description",
      "line_items",
      "terms",
      "notes"
    ]
  ],
  "SafetyChecklist" => [
    "table" => "jd_safety_checklist",
    "required" => [
      "title",
      "date"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "location",
      "date",
      "type",
      "items",
      "filled_by",
      "status",
      "notes"
    ]
  ],
  "SafetyLog" => [
    "table" => "jd_safety_log",
    "required" => [
      "title",
      "type",
      "date"
    ],
    "properties" => [
      "title",
      "type",
      "project_id",
      "project_name",
      "location",
      "date",
      "severity",
      "status",
      "reported_by",
      "description",
      "action_taken",
      "follow_up"
    ]
  ],
  "SafetyProtocol" => [
    "table" => "jd_safety_protocol",
    "required" => [
      "title",
      "category"
    ],
    "properties" => [
      "title",
      "category",
      "risk_level",
      "content",
      "required_ppe",
      "applies_to",
      "file_url",
      "last_updated",
      "created_by"
    ]
  ],
  "Service" => [
    "table" => "jd_service",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "category",
      "description",
      "unit",
      "unit_price",
      "min_price",
      "active"
    ]
  ],
  "ServiceAgreement" => [
    "table" => "jd_service_agreement",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "customer_id",
      "customer_name",
      "customer_email",
      "project_id",
      "project_name",
      "type",
      "status",
      "start_date",
      "end_date",
      "interval_months",
      "next_service_date",
      "annual_value",
      "notes"
    ]
  ],
  "ServiceTask" => [
    "table" => "jd_service_task",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "type",
      "customer_name",
      "address",
      "assigned_to",
      "priority",
      "status",
      "due_date",
      "completed_date",
      "notes"
    ]
  ],
  "Shift" => [
    "table" => "jd_shift",
    "required" => [
      "employee_name",
      "date"
    ],
    "properties" => [
      "employee_name",
      "role",
      "date",
      "start_time",
      "end_time",
      "location",
      "status",
      "notes"
    ]
  ],
  "SignatureRequest" => [
    "table" => "jd_signature_request",
    "required" => [
      "title",
      "customer_email"
    ],
    "properties" => [
      "title",
      "document_url",
      "customer_name",
      "customer_email",
      "project_id",
      "project_name",
      "status",
      "sent_date",
      "signed_date",
      "signed_by",
      "signature_url",
      "expires_date",
      "notes"
    ]
  ],
  "Subcontractor" => [
    "table" => "jd_subcontractor",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "contact_person",
      "email",
      "phone",
      "address",
      "postal_code",
      "city",
      "cvr",
      "trade",
      "status",
      "rating",
      "notes"
    ]
  ],
  "Subscription" => [
    "table" => "jd_subscription",
    "required" => [
      "title",
      "customer_id"
    ],
    "properties" => [
      "title",
      "customer_id",
      "customer_name",
      "customer_email",
      "description",
      "amount",
      "interval",
      "status",
      "start_date",
      "next_invoice_date",
      "end_date",
      "last_invoiced_date",
      "notes"
    ]
  ],
  "Supplier" => [
    "table" => "jd_supplier",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "contact_person",
      "email",
      "phone",
      "address",
      "postal_code",
      "city",
      "cvr",
      "category",
      "notes"
    ]
  ],
  "SupplierInvoice" => [
    "table" => "jd_supplier_invoice",
    "required" => [
      "invoice_number",
      "supplier_name",
      "amount"
    ],
    "properties" => [
      "invoice_number",
      "supplier_name",
      "project_id",
      "project_name",
      "amount",
      "vat_amount",
      "date",
      "due_date",
      "status",
      "category",
      "description",
      "file_url",
      "approved_by",
      "approved_date",
      "journal_entry_id",
      "notes"
    ]
  ],
  "SupportTicket" => [
    "table" => "jd_support_ticket",
    "required" => [
      "subject",
      "customer_email"
    ],
    "properties" => [
      "customer_name",
      "customer_email",
      "subject",
      "message",
      "status",
      "priority",
      "response",
      "responded_at"
    ]
  ],
  "Task" => [
    "table" => "jd_task",
    "required" => [
      "title"
    ],
    "properties" => [
      "title",
      "description",
      "assigned_to",
      "assigned_user_id",
      "project_id",
      "project_name",
      "status",
      "priority",
      "due_date",
      "completed_date"
    ]
  ],
  "TimeEntry" => [
    "table" => "jd_time_entry",
    "required" => [
      "project_id",
      "hours"
    ],
    "properties" => [
      "project_id",
      "project_name",
      "user_name",
      "user_id",
      "date",
      "hours",
      "description",
      "status",
      "clock_started_at",
      "clock_ended_at",
      "task_type"
    ]
  ],
  "User" => [
    "table" => "jd_user",
    "required" => [
      "role"
    ],
    "properties" => [
      "role"
    ]
  ],
  "VacationRequest" => [
    "table" => "jd_vacation_request",
    "required" => [
      "employee_name",
      "start_date",
      "end_date",
      "type"
    ],
    "properties" => [
      "employee_name",
      "employee_email",
      "start_date",
      "end_date",
      "type",
      "status",
      "submitted_date",
      "notes",
      "manager_note"
    ]
  ],
  "VatReport" => [
    "table" => "jd_vat_report",
    "required" => [
      "period"
    ],
    "properties" => [
      "period",
      "period_type",
      "sales_basis",
      "output_vat",
      "purchase_basis",
      "input_vat",
      "payable_vat",
      "due_date",
      "status",
      "submitted_date",
      "notes"
    ]
  ],
  "Vehicle" => [
    "table" => "jd_vehicle",
    "required" => [
      "name"
    ],
    "properties" => [
      "name",
      "plate_number",
      "type",
      "status",
      "location",
      "assigned_project_name",
      "mileage",
      "fuel_type",
      "insurance_provider",
      "insurance_policy",
      "insurance_expiry",
      "last_service_date",
      "last_service_mileage",
      "next_service_date",
      "next_service_mileage",
      "last_inspection_date",
      "inspection_due",
      "notes"
    ]
  ],
  "WasteLog" => [
    "table" => "jd_waste_log",
    "required" => [
      "title",
      "waste_type",
      "date"
    ],
    "properties" => [
      "title",
      "project_id",
      "project_name",
      "waste_type",
      "amount",
      "unit",
      "disposal_method",
      "disposal_facility",
      "date",
      "certified",
      "certificate_number",
      "receipt_url",
      "reported_by",
      "notes"
    ]
  ],
  "WebsiteInquiry" => [
    "table" => "jd_website_inquiry",
    "required" => [
      "name",
      "email"
    ],
    "properties" => [
      "name",
      "email",
      "phone",
      "project_type",
      "description",
      "request_summary",
      "line_items",
      "estimated_budget",
      "quote_total",
      "address",
      "source",
      "status",
      "converted_project_id",
      "submitted_date",
      "notes"
    ]
  ]
];
