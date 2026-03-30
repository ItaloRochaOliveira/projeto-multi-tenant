import type { ServiceResult } from "@/interfaces/IServiceModel";

/** Resposta de sucesso alinhada a `ServiceResult` (uso nos serviços antes do envio HTTP). */
export function ok<R>(code: number, message: R): ServiceResult<R> {
  return {
    status: "success",
    message: {
      code,
      message,
    },
  };
}
