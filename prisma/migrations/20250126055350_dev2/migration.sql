-- CreateTable
CREATE TABLE "GeneratedApp" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedApp" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "responseTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "utilizationPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCode" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "content" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "allowedViews" INTEGER,
    "remainingViews" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedApp_id_idx" ON "GeneratedApp"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SavedApp_appId_key" ON "SavedApp"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_appId_key" ON "Analytics"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCode_appId_key" ON "SharedCode"("appId");

-- CreateIndex
CREATE INDEX "SharedCode_appId_idx" ON "SharedCode"("appId");

-- AddForeignKey
ALTER TABLE "SavedApp" ADD CONSTRAINT "SavedApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "GeneratedApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_appId_fkey" FOREIGN KEY ("appId") REFERENCES "GeneratedApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCode" ADD CONSTRAINT "SharedCode_appId_fkey" FOREIGN KEY ("appId") REFERENCES "GeneratedApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
