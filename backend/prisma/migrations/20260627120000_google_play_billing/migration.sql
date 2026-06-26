-- Google Play billing fields (alongside existing PayPal)

ALTER TABLE `Subscription`
  ADD COLUMN `billingProvider` ENUM('PAYPAL', 'GOOGLE_PLAY') NOT NULL DEFAULT 'PAYPAL',
  ADD COLUMN `googlePlayPurchaseToken` VARCHAR(500) NULL,
  ADD COLUMN `googlePlayProductId` VARCHAR(191) NULL,
  ADD COLUMN `googlePlayOrderId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Subscription_googlePlayOrderId_key`(`googlePlayOrderId`),
  ADD INDEX `Subscription_googlePlayProductId_idx`(`googlePlayProductId`);

ALTER TABLE `Payment`
  ADD COLUMN `billingProvider` ENUM('PAYPAL', 'GOOGLE_PLAY') NOT NULL DEFAULT 'PAYPAL',
  ADD COLUMN `googlePlayOrderId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Payment_googlePlayOrderId_key`(`googlePlayOrderId`);
