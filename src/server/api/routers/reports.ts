import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

// Report interface
interface SavedReport {
  id: string;
  name: string;
  athleteId: string | null;
  athleteName: string;
  exercise: string | null;
  timeRange: string;
  createdAt: Date;
}

// In-memory storage for reports
const savedReports: SavedReport[] = [];

export const reportsRouter = createTRPCRouter({
  // Save a new report
  save: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      athleteId: z.string().nullable(),
      athleteName: z.string(),
      exercise: z.string().nullable(),
      timeRange: z.string(),
    }))
    .mutation(async ({ input }) => {
      const report: SavedReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        athleteId: input.athleteId,
        athleteName: input.athleteName,
        exercise: input.exercise,
        timeRange: input.timeRange,
        createdAt: new Date(),
      };
      savedReports.push(report);
      return report;
    }),

  // Get all saved reports
  getAll: publicProcedure.query(() => {
    return savedReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  // Delete a report
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const index = savedReports.findIndex(report => report.id === input.id);
      if (index !== -1) {
        const deletedReport = savedReports.splice(index, 1)[0];
        return deletedReport;
      }
      throw new Error("Report not found");
    }),
});