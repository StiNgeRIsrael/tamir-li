-- AlterTable
ALTER TABLE `User` ADD COLUMN `blocked` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ToolConfig` (
    `toolId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(500) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`toolId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
