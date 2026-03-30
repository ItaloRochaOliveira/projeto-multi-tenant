import type { IHttpContext, IRequest } from "@/interfaces/IRequest";
import type { Request, Response } from "express";

/**
 * Adapta Request/Response do Express para o contrato IHttpContext.
 * Útil quando quiser padronizar controllers com `getRequest()` / `send()`.
 */
export class ExpressAdapter implements IHttpContext {
  constructor(
    private readonly request: Request,
    private readonly response: Response,
  ) {}

  getRequest(): IRequest {
    return {
      header: this.request.headers as Record<string, unknown>,
      params: this.request.params as Record<string, string>,
      query: this.request.query as Record<string, unknown>,
      body: this.request.body,
    };
  }

  send(status: number, data: unknown): void {
    this.response.status(status).json(data);
  }
}
