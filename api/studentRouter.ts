import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { onouClient } from "./lib/onouClient";
import { signToken } from "./lib/session";
import { getDb } from "./queries/connection";
import { students } from "@db/schema";
import { eq } from "drizzle-orm";

export const studentRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        studentId: z.string().min(1, "Student ID is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      // Step 1: WebEtu login
      const loginResult = await onouClient.login(
        input.studentId,
        input.password
      );

      const dias = loginResult.dias
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const diaId = dias.length > 4 ? dias[4] : dias[dias.length - 1];

      if (!diaId) {
        throw new Error("No DIA ID found in login response");
      }

      // Step 2a: Fetch wilaya
      const wilaya = await onouClient.fetchWilaya(loginResult.token, diaId);

      // Step 2b: Fetch residence
      const residence = await onouClient.fetchResidence(
        loginResult.token,
        loginResult.uuid,
        diaId
      );

      // Step 3: ONOU login
      const onouToken = await onouClient.onouLogin(
        loginResult.uuid,
        wilaya,
        residence,
        loginResult.token
      );

      // Step 4: Store in database
      const db = getDb();
      const existing = await db
        .select()
        .from(students)
        .where(eq(students.studentId, input.studentId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(students)
          .set({
            password: input.password,
            webetuToken: loginResult.token,
            onouToken,
            uuid: loginResult.uuid,
            diaId,
            wilaya,
            residence,
            updatedAt: new Date(),
          })
          .where(eq(students.studentId, input.studentId));
      } else {
        // Insert new
        await db.insert(students).values({
          studentId: input.studentId,
          password: input.password,
          webetuToken: loginResult.token,
          onouToken,
          uuid: loginResult.uuid,
          diaId,
          wilaya,
          residence,
        });
      }

      // Step 5: Generate session token
      const token = signToken(input.studentId);

      return {
        token,
        student: {
          studentId: input.studentId,
          uuid: loginResult.uuid,
          wilaya,
          residence,
        },
      };
    }),

  me: authedQuery.query(async ({ ctx }) => {
    return {
      id: ctx.student.id,
      studentId: ctx.student.studentId,
      uuid: ctx.student.uuid,
      diaId: ctx.student.diaId,
      wilaya: ctx.student.wilaya,
      residence: ctx.student.residence,
      createdAt: new Date(), // placeholder, will be from DB
    };
  }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(students)
      .set({
        webetuToken: null,
        onouToken: null,
        updatedAt: new Date(),
      })
      .where(eq(students.studentId, ctx.student.studentId));

    return { success: true };
  }),
});
