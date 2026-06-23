-- CreateTable
CREATE TABLE `AdSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `zoneBanner` VARCHAR(64) NULL,
    `zoneSidebar` VARCHAR(64) NULL,
    `zoneSidebar2` VARCHAR(64) NULL,
    `zoneInline` VARCHAR(64) NULL,
    `popunderScriptUrl` VARCHAR(512) NULL,
    `nativeScriptUrl` VARCHAR(512) NULL,
    `nativeContainerId` VARCHAR(128) NULL,
    `invokeHost` VARCHAR(128) NULL DEFAULT 'www.highperformanceformat.com',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
