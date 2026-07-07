-- AppSettings singleton for global app flags (onboarding reprompt generation)
CREATE TABLE `AppSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `onboardingOfferGeneration` INTEGER NOT NULL DEFAULT 0,
    `onboardingRepromptedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `AppSettings` (`id`, `onboardingOfferGeneration`) VALUES ('default', 0);
