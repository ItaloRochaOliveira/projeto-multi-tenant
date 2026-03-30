import GetTenantBySlugController from "@/controller/Tenant/GetTenantBySlugController";
import { Router } from "express";

const router = Router();

router.get("/:slug", (req, res, next) =>
  new GetTenantBySlugController().handle(req, res, next),
);

export default router;
