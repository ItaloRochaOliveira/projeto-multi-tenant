import type { UserPayload } from "./IRequestToken";

export interface DataInsert {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

export interface ITokeManager {
  createToken(
    data: DataInsert,
    tokenSecret: string,
    expiresIn: string,
  ): string;
  getPayload(token: string, tokenSecret: string): UserPayload;
}
