-- PayPal billing: optional Stripe fields, PayPal subscription/payment IDs
ALTER TABLE `Subscription` MODIFY `stripeCustomerId` VARCHAR(191) NULL;

ALTER TABLE `Subscription`
  ADD COLUMN `paymentProvider` ENUM('STRIPE', 'PAYPAL') NOT NULL DEFAULT 'PAYPAL',
  ADD COLUMN `paypalSubscriptionId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Subscription_paypalSubscriptionId_key` ON `Subscription`(`paypalSubscriptionId`);
CREATE INDEX `Subscription_paypalSubscriptionId_idx` ON `Subscription`(`paypalSubscriptionId`);

ALTER TABLE `Payment` ADD COLUMN `paypalTransactionId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Payment_paypalTransactionId_key` ON `Payment`(`paypalTransactionId`);
