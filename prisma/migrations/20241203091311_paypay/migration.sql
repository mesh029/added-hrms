/*
  Warnings:

  - You are about to alter the column `pay` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `pay` INTEGER NULL;
