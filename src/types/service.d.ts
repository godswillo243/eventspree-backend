export type ServiceReturnType<TData = unknown, TMeta = unknown> = Promise<{
  statusCode: number;
  message: string;
  data: TData;
  meta?: Record<string, TMeta>;
}>;

export {};
