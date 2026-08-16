-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('TEACHER', 'AI');

-- AlterTable
ALTER TABLE "KnowledgeItem" ADD COLUMN     "source" "KnowledgeSource" NOT NULL DEFAULT 'TEACHER',
ADD COLUMN     "validated" BOOLEAN NOT NULL DEFAULT false;
