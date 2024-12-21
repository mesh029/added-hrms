-- AlterTable
ALTER TABLE `User` ADD COLUMN `signature` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Approval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `approverId` INTEGER NOT NULL,
    `approverRole` VARCHAR(191) NOT NULL,
    `approverName` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `timesheetId` INTEGER NULL,
    `leaveRequestId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `Timesheet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `Leave`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
