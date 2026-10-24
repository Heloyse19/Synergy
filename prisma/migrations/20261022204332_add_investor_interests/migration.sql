-- CreateTable
CREATE TABLE `InvestorInterest` (
    `id` VARCHAR(191) NOT NULL,
    `investorId` VARCHAR(191) NOT NULL,
    `nicheId` INTEGER NOT NULL,

    INDEX `InvestorInterest_investorId_idx`(`investorId`),
    UNIQUE INDEX `InvestorInterest_investorId_nicheId_key`(`investorId`, `nicheId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InvestorInterest` ADD CONSTRAINT `InvestorInterest_investorId_fkey` FOREIGN KEY (`investorId`) REFERENCES `InvestorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvestorInterest` ADD CONSTRAINT `InvestorInterest_nicheId_fkey` FOREIGN KEY (`nicheId`) REFERENCES `Niche`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
