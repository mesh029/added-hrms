/*
  Warnings:

  - Added the required column `reason` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Leave` ADD COLUMN `reason` VARCHAR(191) NOT NULL;
