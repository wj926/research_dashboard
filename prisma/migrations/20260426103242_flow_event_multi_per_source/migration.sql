-- DropIndex
DROP INDEX "FlowEvent_projectSlug_source_key";

-- CreateIndex
CREATE INDEX "FlowEvent_projectSlug_source_idx" ON "FlowEvent"("projectSlug", "source");
