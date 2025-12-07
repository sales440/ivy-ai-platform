-- Add sector, sequence, and delayDays columns to emailCampaigns table
-- These columns are needed for EPM Construcciones email templates

ALTER TABLE emailCampaigns 
ADD COLUMN sector VARCHAR(50) NULL COMMENT 'educativo, hotelero, residencial, etc.',
ADD COLUMN sequence INT NULL COMMENT '1, 2, 3, 4 (order in follow-up sequence)',
ADD COLUMN delayDays INT NULL COMMENT '0, 3, 7, 14 (days to wait before sending)';
