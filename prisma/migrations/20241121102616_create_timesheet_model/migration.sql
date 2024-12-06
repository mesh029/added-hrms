/*
  Warnings:

  - You are about to drop the column `date` on the `Timesheet` table. All the data in the column will be lost.
  - You are about to drop the column `hours` on the `Timesheet` table. All the data in the column will be lost.
  - Added the required column `month` to the `Timesheet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Timesheet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Timesheet` DROP COLUMN `date`,
    DROP COLUMN `hours`,
    ADD COLUMN `month` INTEGER NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `TimesheetEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timesheetId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `hours` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimesheetEntry` ADD CONSTRAINT `TimesheetEntry_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `Timesheet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
