-- OnboardingResponse: stores quiz answers + attribution for admin analytics
CREATE TABLE `OnboardingResponse` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(64) NULL,
    `offerGeneration` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(32) NOT NULL,
    `frequency` VARCHAR(32) NOT NULL,
    `pain` VARCHAR(32) NOT NULL,
    `attribution` VARCHAR(32) NOT NULL,
    `offerDecision` VARCHAR(16) NOT NULL,
    `selectedPlan` VARCHAR(16) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OnboardingResponse_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `OnboardingResponse_createdAt_idx`(`createdAt`),
    INDEX `OnboardingResponse_attribution_idx`(`attribution`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OnboardingResponse` ADD CONSTRAINT `OnboardingResponse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
