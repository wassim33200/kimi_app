import { createRouter, authedQuery } from "./middleware";
import { onouClient } from "./lib/onouClient";
import { getDb } from "./queries/connection";
import { students } from "@db/schema";
import { eq } from "drizzle-orm";

export const depotRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
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

    const depots = await onouClient.getDepots(
      student.uuid,
      student.wilaya,
      student.residence,
      student.onouToken
    );

    return depots;
  }),
});
