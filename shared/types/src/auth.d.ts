import type { PlanType } from "./enums";
export type AuthUser = {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    ci: string;
    planType: PlanType;
    calculosRealizados?: number;
};
export type LoginRequest = {
    email: string;
    password: string;
};
export type RegisterRequest = LoginRequest & {
    nombre: string;
    apellido: string;
    ci: string;
};
export type AuthResponse = {
    user: AuthUser;
    token: string;
};
export type EstudioSession = {
    sub: string;
    usuario: string;
    rol: import("./enums").RolSesion;
};
