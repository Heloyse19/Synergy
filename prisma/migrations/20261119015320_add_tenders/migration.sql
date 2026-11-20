-- CreateTable
CREATE TABLE `Tender` (
    `id` VARCHAR(191) NOT NULL,
    `pncpId` VARCHAR(40) NOT NULL,
    `object` TEXT NOT NULL,
    `searchText` TEXT NOT NULL,
    `agencyName` VARCHAR(191) NOT NULL,
    `agencyCnpj` CHAR(14) NOT NULL,
    `unitName` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `uf` CHAR(2) NOT NULL,
    `modalityId` INTEGER NOT NULL,
    `modalityName` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NULL,
    `estimatedValue` DECIMAL(18, 2) NULL,
    `isPriceRegistration` BOOLEAN NOT NULL DEFAULT false,
    `opensAt` DATETIME(3) NULL,
    `closesAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `lastSeenAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tender_pncpId_key`(`pncpId`),
    INDEX `Tender_uf_closesAt_idx`(`uf`, `closesAt`),
    INDEX `Tender_closesAt_idx`(`closesAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenderSync` (
    `uf` CHAR(2) NOT NULL,
    `status` ENUM('RUNNING', 'SUCCEEDED', 'FAILED') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `heartbeatAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `pagesDone` INTEGER NOT NULL DEFAULT 0,
    `totalPages` INTEGER NULL,
    `tenderCount` INTEGER NOT NULL DEFAULT 0,
    `error` VARCHAR(300) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uf`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
