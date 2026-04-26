-- CreateTable
CREATE TABLE "FlowEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectSlug" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "bullets" TEXT,
    "numbers" TEXT,
    "tags" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FlowEvent_projectSlug_fkey" FOREIGN KEY ("projectSlug") REFERENCES "Project" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FlowEvent_projectSlug_date_idx" ON "FlowEvent"("projectSlug", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FlowEvent_projectSlug_source_key" ON "FlowEvent"("projectSlug", "source");
