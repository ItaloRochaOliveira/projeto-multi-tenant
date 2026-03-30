import "express-async-errors";
import authRoutes from "@/routes/authRoutes";
import consultationRoutes from "@/routes/consultationRoutes";
import medicalRecordEntryRoutes from "@/routes/medicalRecordEntryRoutes";
import medicalRecordRoutes from "@/routes/medicalRecordRoutes";
import patientRoutes from "@/routes/patientRoutes";
import tenantApiRoutes from "@/routes/tenantApiRoutes";
import tenantRoutes from "@/routes/tenantRoutes";
import userRoutes from "@/routes/userRoutes";
import errorMiddleware from "@/middleware/ErrorMidleware";
import cors from "cors";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "multi-tenant-saude",
    message:
      "API multi-tenant (clínica/hospital). GET /tenants/:slug (público); /api/tenants; /api/users; /api/patients; /api/consultations; /api/medical-records; /api/medical-record-entries; /auth.",
  });
});

app.use("/tenants", tenantRoutes);
app.use("/api/tenants", tenantApiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/medical-record-entries", medicalRecordEntryRoutes);
app.use("/auth", authRoutes);

app.use(errorMiddleware);

export default app;
