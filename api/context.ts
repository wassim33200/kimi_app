import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/session";
import { getDb } from "./queries/connection";
import { students } from "@db/schema";
import { eq } from "drizzle-orm";

export type StudentContext = {
  id: number;
  studentId: string;
  uuid: string | null;
  diaId: string | null;
  wilaya: string | null;
  residence: string | null;
  webetuToken: string | null;
  onouToken: string | null;
  password: string;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  student?: StudentContext;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const token = opts.req.headers.get("x-student-token");
  let student: StudentContext | undefined;

  if (token) {
    const studentId = verifyToken(token);
    if (studentId) {
      const db = getDb();
      const found = await db
        .select()
        .from(students)
        .where(eq(students.studentId, studentId))
        .limit(1);
      if (found.length > 0) {
        const s = found[0];
        student = {
          id: s.id,
          studentId: s.studentId,
          uuid: s.uuid,
          diaId: s.diaId,
          wilaya: s.wilaya,
          residence: s.residence,
          webetuToken: s.webetuToken,
          onouToken: s.onouToken,
          password: s.password,
        };
      }
    }
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    student,
  };
}
