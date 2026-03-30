import LoginController from "@/controller/Auth/LoginController";
import SignupController from "@/controller/Auth/SignupController";
import { authenticateToken } from "@/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/login", (req, res, next) =>
  new LoginController().handle(req, res, next),
);

router.post("/signup", authenticateToken, (req, res, next) =>
  new SignupController().handle(req, res, next),
);

export default router;
