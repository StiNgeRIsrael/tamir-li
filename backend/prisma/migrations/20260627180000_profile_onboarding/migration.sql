-- Profile fields for native onboarding personalization
ALTER TABLE `Profile` ADD COLUMN `preferredCategory` VARCHAR(32) NULL;
ALTER TABLE `Profile` ADD COLUMN `onboardingCompletedAt` DATETIME(3) NULL;
