/**
 * ENTERPRISE ACTION CONTRACT
 * Menggunakan Discriminated Union untuk memastikan type-safety antara Server dan Client.
 */

export type FieldErrors<T> = {
    [K in keyof T]?: string[];
};

export type ActionState<TInput, TOutput> = {
    status: "IDLE" | "SUCCESS" | "ERROR" | "VALIDATION_ERROR";
    data?: TOutput;
    errors?: FieldErrors<TInput>;
    message?: string;
};