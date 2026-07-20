import type {
  ApiErrorBody,
  ApiResult,
  AuthResponse,
  ActoSimulador,
  ClienteRow,
  EstudioSession,
  GastoRow,
  GastosListadoResponse,
  LoginRequest,
  PresupuestoRow,
  RegisterRequest,
  SimuladorResultado,
} from "@shared/types";

export type TokenStorage = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
};

export type ApiClientOptions = {
  baseUrl: string;
  /** Prefijo de rutas REST (ej. /api/v1) */
  apiPrefix?: string;
  storage?: TokenStorage;
  credentials?: RequestCredentials;
  onUnauthorized?: () => void;
};

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function parseErrorMessage(status: number, body: ApiErrorBody | null): string {
  if (body?.error && typeof body.error === "string") return body.error;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join(", ") : body.message;
  }
  if (status === 401) return "No autorizado.";
  if (status === 403) return "Acceso denegado.";
  if (status >= 500) return "Error del servidor.";
  return `Error HTTP ${status}`;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly storage?: TokenStorage;
  private readonly credentials: RequestCredentials;
  private readonly onUnauthorized?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiPrefix = (options.apiPrefix ?? "/api/v1").replace(/\/$/, "");
    this.storage = options.storage;
    this.credentials = options.credentials ?? "include";
    this.onUnauthorized = options.onUnauthorized;
  }

  setToken(token: string | null): void {
    this.storage?.setAccessToken(token);
  }

  getToken(): string | null {
    return this.storage?.getAccessToken() ?? null;
  }

  private buildHeaders(extra?: HeadersInit, sendToken = true): Headers {
    const headers = new Headers(extra);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (sendToken) {
      const token = this.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    init?: {
      body?: unknown;
      searchParams?: Record<string, string | number | undefined>;
      /** Si false, un 401 no dispara onUnauthorized (p. ej. login fallido). */
      authRedirect?: boolean;
      /** Si false, no envía Authorization (p. ej. login). */
      sendToken?: boolean;
    }
  ): Promise<ApiResult<T>> {
    let url = joinUrl(this.baseUrl, `${this.apiPrefix}${path.startsWith("/") ? path : `/${path}`}`);
    if (init?.searchParams) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(init.searchParams)) {
        if (v !== undefined && v !== "") sp.set(k, String(v));
      }
      const qs = sp.toString();
      if (qs) url += `?${qs}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: this.buildHeaders(undefined, init?.sendToken !== false),
        credentials: this.credentials,
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      return {
        ok: false,
        status: 0,
        error:
          "No se pudo conectar con el servidor. Verificá que el API esté en marcha (puerto 4000): npm run dev:backend",
      };
    }

    let body: ApiErrorBody | T | null = null;
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text) as ApiErrorBody | T;
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401 && init?.authRedirect !== false) {
        this.onUnauthorized?.();
      }
      return {
        ok: false,
        status: response.status,
        error: parseErrorMessage(response.status, body as ApiErrorBody | null),
        body: body as ApiErrorBody | undefined,
      };
    }

    return { ok: true, data: body as T };
  }

  async get<T>(path: string, searchParams?: Record<string, string | number | undefined>) {
    return this.request<T>("GET", path, { searchParams });
  }

  async post<T>(
    path: string,
    body?: unknown,
    opts?: { authRedirect?: boolean; sendToken?: boolean },
  ) {
    return this.request<T>("POST", path, { body, ...opts });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    opts?: { authRedirect?: boolean; sendToken?: boolean },
  ) {
    return this.request<T>("PATCH", path, { body, ...opts });
  }

  async delete<T>(path: string, opts?: { authRedirect?: boolean; sendToken?: boolean }) {
    return this.request<T>("DELETE", path, opts);
  }

  // --- Auth (usuarios sitio / Nest JWT) ---

  async login(dto: LoginRequest) {
    const res = await this.post<AuthResponse>("/auth/login", dto);
    if (res.ok) this.setToken(res.data.token);
    return res;
  }

  async register(dto: RegisterRequest) {
    const res = await this.post<AuthResponse>("/auth/register", dto);
    if (res.ok) this.setToken(res.data.token);
    return res;
  }

  async me() {
    return this.get<AuthResponse["user"]>("/auth/me");
  }

  async logoutLocal() {
    this.setToken(null);
  }

  // --- Estudio ---

  async loginEstudio(dto: { usuario: string; password: string }) {
    this.setToken(null);
    const res = await this.post<{ token: string; usuario: string; nombre: string; rol: string }>(
      "/estudio/auth/login",
      dto,
      { authRedirect: false, sendToken: false },
    );
    if (res.ok) this.setToken(res.data.token);
    return res;
  }

  async meEstudio() {
    return this.get<EstudioSession>("/estudio/auth/me");
  }

  async listarGastos(params?: Record<string, string | number | undefined>) {
    return this.get<GastosListadoResponse>("/estudio/gastos", params);
  }

  async listarClientes(params?: Record<string, string | number | undefined>) {
    return this.get<ClienteRow[]>("/estudio/clientes", params);
  }

  async obtenerCliente(id: string) {
    return this.get<ClienteRow>(`/estudio/clientes/${id}`);
  }

  async crearCliente(body: Partial<ClienteRow> & { nombre: string; documento: string }) {
    return this.post<ClienteRow>("/estudio/clientes", body);
  }

  async actualizarCliente(id: string, body: Partial<ClienteRow>) {
    return this.patch<ClienteRow>(`/estudio/clientes/${id}`, body);
  }

  async eliminarCliente(id: string) {
    return this.delete<{ ok: boolean }>(`/estudio/clientes/${id}`);
  }

  async obtenerGasto(id: string) {
    return this.get<GastoRow>(`/estudio/gastos/${id}`);
  }

  async crearGasto(body: unknown) {
    return this.post<GastoRow>("/estudio/gastos", body);
  }

  async actualizarGasto(id: string, body: unknown) {
    return this.patch<GastoRow>(`/estudio/gastos/${id}`, body);
  }

  async eliminarGasto(id: string) {
    return this.delete<{ ok: boolean }>(`/estudio/gastos/${id}`);
  }

  async listarPresupuestos(params?: Record<string, string | number | undefined>) {
    return this.get<PresupuestoRow[]>("/estudio/presupuestos", params);
  }

  async obtenerPresupuesto(id: string) {
    return this.get<PresupuestoRow>(`/estudio/presupuestos/${id}`);
  }

  async crearPresupuesto(body: {
    clienteId: string;
    titulo?: string;
    estado?: string;
    honorarioACobrar?: number;
    totalPresupuesto?: number;
    notas?: string;
  }) {
    return this.post<PresupuestoRow>("/estudio/presupuestos", body);
  }

  async actualizarPresupuesto(id: string, body: Record<string, unknown>) {
    return this.patch<PresupuestoRow>(`/estudio/presupuestos/${id}`, body);
  }

  async eliminarPresupuesto(id: string) {
    return this.delete<{ ok: boolean }>(`/estudio/presupuestos/${id}`);
  }

  async listarActosSimulador() {
    return this.get<ActoSimulador[]>("/simulador/actos");
  }

  async calcularSimulador(body: {
    actoKey: string;
    valorAsignadoPartes?: number;
    urSemestralPesos: number;
    uiPesos?: number;
    dolarPesos?: number;
    fonasaPct?: number;
    irpfPct?: number;
    honorarioACobrar?: number;
  }) {
    return this.post<SimuladorResultado>("/simulador/calcular", body);
  }
}

export function createMemoryTokenStorage(initial: string | null = null): TokenStorage {
  let token = initial;
  return {
    getAccessToken: () => token,
    setAccessToken: (t) => {
      token = t;
    },
  };
}

export function createLocalStorageTokenStorage(key = "api_access_token"): TokenStorage {
  return {
    getAccessToken: () => {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    },
    setAccessToken: (t) => {
      if (typeof localStorage === "undefined") return;
      if (t) localStorage.setItem(key, t);
      else localStorage.removeItem(key);
    },
  };
}
