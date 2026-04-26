-- CreateTable
CREATE TABLE "FlowEventTaskLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectSlug" TEXT NOT NULL,
    "eventSource" TEXT NOT NULL,
    "todoId" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlowEventTaskLink_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "TodoItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TodoItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectSlug" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "goal" TEXT,
    "subtasks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    CONSTRAINT "TodoItem_projectSlug_fkey" FOREIGN KEY ("projectSlug") REFERENCES "Project" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TodoItem" ("bucket", "done", "id", "position", "projectSlug", "text") SELECT "bucket", "done", "id", "position", "projectSlug", "text" FROM "TodoItem";
DROP TABLE "TodoItem";
ALTER TABLE "new_TodoItem" RENAME TO "TodoItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FlowEventTaskLink_projectSlug_eventSource_idx" ON "FlowEventTaskLink"("projectSlug", "eventSource");

-- CreateIndex
CREATE UNIQUE INDEX "FlowEventTaskLink_projectSlug_eventSource_todoId_key" ON "FlowEventTaskLink"("projectSlug", "eventSource", "todoId");
