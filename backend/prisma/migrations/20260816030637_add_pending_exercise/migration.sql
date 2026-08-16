-- CreateTable
CREATE TABLE "PendingExercise" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "PendingExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingExercise_userId_subjectId_idx" ON "PendingExercise"("userId", "subjectId");

-- AddForeignKey
ALTER TABLE "PendingExercise" ADD CONSTRAINT "PendingExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingExercise" ADD CONSTRAINT "PendingExercise_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
