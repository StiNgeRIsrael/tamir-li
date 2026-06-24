-- CreateTable
CREATE TABLE `AiSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `googleApiKey` VARCHAR(256) NULL,
    `modelName` VARCHAR(128) NOT NULL DEFAULT 'imagen-3.0-generate-002',
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiGenerationLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILED') NOT NULL,
    `creditsCharged` INTEGER NOT NULL DEFAULT 0,
    `estimatedCostUsd` DECIMAL(10, 6) NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'google',
    `model` VARCHAR(128) NULL,
    `promptPreview` VARCHAR(200) NULL,
    `errorMessage` TEXT NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AiGenerationLog_userId_createdAt_idx` ON `AiGenerationLog`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `AiGenerationLog_createdAt_idx` ON `AiGenerationLog`(`createdAt`);

-- CreateIndex
CREATE INDEX `AiGenerationLog_status_createdAt_idx` ON `AiGenerationLog`(`status`, `createdAt`);

-- AddForeignKey
ALTER TABLE `AiGenerationLog` ADD CONSTRAINT `AiGenerationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
