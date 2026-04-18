import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";

export const students = mysqlTable("students", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  webetuToken: text("webetu_token"),
  onouToken: text("onou_token"),
  uuid: varchar("uuid", { length: 100 }),
  diaId: varchar("dia_id", { length: 50 }),
  wilaya: varchar("wilaya", { length: 10 }),
  residence: varchar("residence", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reservations = mysqlTable("reservations", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  reservationDate: varchar("reservation_date", { length: 20 }).notNull(),
  mealType: int("meal_type").notNull(),
  depotId: varchar("depot_id", { length: 50 }).notNull(),
  depotName: varchar("depot_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  apiResponse: text("api_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
