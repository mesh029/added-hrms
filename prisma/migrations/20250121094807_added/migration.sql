-- DropForeignKey
ALTER TABLE `Approval` DROP FOREIGN KEY `Approval_approverId_fkey`;

-- DropForeignKey
ALTER TABLE `Approval` DROP FOREIGN KEY `Approval_leaveRequestId_fkey`;

-- DropForeignKey
ALTER TABLE `Approval` DROP FOREIGN KEY `Approval_timesheetId_fkey`;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `Timesheet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `Leave`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
