-- CreateTable
CREATE TABLE "FlowEventComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "flowEventId" INTEGER NOT NULL,
    "authorLogin" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlowEventComment_flowEventId_fkey" FOREIGN KEY ("flowEventId") REFERENCES "FlowEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FlowEventComment_flowEventId_createdAt_idx" ON "FlowEventComment"("flowEventId", "createdAt");
