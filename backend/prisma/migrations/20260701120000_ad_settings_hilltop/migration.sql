-- AlterTable
ALTER TABLE `AdSettings` ADD COLUMN `hilltopBannerScriptUrl` VARCHAR(512) NULL,
    ADD COLUMN `hilltopSidebarScriptUrl` VARCHAR(512) NULL,
    ADD COLUMN `hilltopMobileBannerScriptUrl` VARCHAR(512) NULL,
    ADD COLUMN `hilltopPopunderUrl` VARCHAR(512) NULL;
