import { env } from "@/env";
import { DataSource } from "typeorm";
import {
  Consultation,
  MedicalRecord,
  MedicalRecordEntry,
  Patient,
  Tenant,
  User,
} from "./entities";

export const appDataSource = new DataSource({
  type: "mysql",
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  username: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  synchronize: false,
  logging: env.ENV === "dev",
  entities: [Tenant, User, Patient, Consultation, MedicalRecord, MedicalRecordEntry],
  subscribers: [],
  migrations: [],
});
