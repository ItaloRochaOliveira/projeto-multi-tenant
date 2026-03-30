import MedicalRecordEntryApiController from "@/controller/MedicalRecordEntry/MedicalRecordEntryApiController";
import { authenticateToken, type AuthRequest } from "@/middleware/auth";
import { Router } from "express";

const router = Router();
const ctrl = new MedicalRecordEntryApiController();

router.use(authenticateToken);
router.get("/", (req, res, next) =>
  ctrl.list(req as AuthRequest, res, next),
);
router.get("/:id", (req, res, next) =>
  ctrl.getById(req as AuthRequest, res, next),
);
router.post("/", (req, res, next) =>
  ctrl.create(req as AuthRequest, res, next),
);
router.put("/:id", (req, res, next) =>
  ctrl.update(req as AuthRequest, res, next),
);
router.delete("/:id", (req, res, next) =>
  ctrl.remove(req as AuthRequest, res, next),
);

export default router;
