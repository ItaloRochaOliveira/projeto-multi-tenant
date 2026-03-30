/** Contrato mínimo de resposta HTTP (alinhado ao encadeamento do Express). */
export interface IResponse {
  status(code: number): IResponse;
  json(body: unknown): IResponse;
}
