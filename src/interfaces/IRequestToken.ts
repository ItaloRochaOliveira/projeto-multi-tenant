import type { Request } from "express";

export interface UserPayload {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

export interface RequestToken extends Request {
  user?: UserPayload;
}
