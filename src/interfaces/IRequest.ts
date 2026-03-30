import { UserPayload } from "./IRequestToken";

export interface IRequest {
  header: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  user?: UserPayload;
}

export interface IHttpContext {
  getRequest(): IRequest;
  send(status: number, data: unknown): void;
}
