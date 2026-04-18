import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { onouClient } from "./lib/onouClient";
import { getDb } from "./queries/connection";
import { students, reservations } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const reservationRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
        mealType: z.number().min(1).max(3),
        depotId: z.string().min(1),
        depotName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const found = await db
        .select()
        .from(students)
        .where(eq(students.studentId, ctx.student.studentId))
        .limit(1);

      if (found.length === 0) {
        throw new Error("Student not found");
      }

      const student = found[0];
      if (!student.uuid || !student.wilaya || !student.residence || !student.onouToken) {
        throw new Error("Session expired, please log in again");
      }

      const result = await onouClient.reserveMeals(
        [input.date],
        input.depotId,
        input.mealType,
        student.uuid,
        student.wilaya,
        student.residence,
        student.onouToken
      );

      // Store reservation in DB
      await db.insert(reservations).values({
        studentId: ctx.student.studentId,
        reservationDate: input.date,
        mealType: input.mealType,
        depotId: input.depotId,
        depotName: input.depotName || null,
        status: result.success ? "success" : "failed",
        apiResponse: result.message,
      });

      return {
        success: result.success,
        message: result.message,
      };
    }),

  history: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const history = await db
      .select()
      .from(reservations)
      .where(eq(reservations.studentId, ctx.student.studentId))
      .orderBy(desc(reservations.createdAt));

    return history;
  }),
});
