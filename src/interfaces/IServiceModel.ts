/** Forma comum das respostas de serviço (alinhada a `execute` abaixo). */
export type ServiceResult<R> = {
    status: string;
    message: {
        code: number;
        message: R;
    };
};

export type ServicePromise<R> = Promise<ServiceResult<R>>;

export default interface IServiceModel<T, R> {
    execute(data: T): ServicePromise<R>;
}