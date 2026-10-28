/**
 * auth/api — client gọi các endpoint xác thực.
 *
 * Mọi request đều gửi kèm cookie (`credentials: "include"`) vì phiên nằm trong
 * cookie httpOnly do server đặt. Không lưu token ở localStorage — tránh XSS
 * đánh cắp phiên.
 */

export type Role = "user" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `Lỗi máy chủ (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (typeof body.error === "string") message = body.error;
    } catch {
      // Không phải JSON — giữ thông báo mặc định.
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  name: string,
  password: string,
): Promise<{ user: AuthUser }> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/api/auth/logout", { method: "POST" });
}

export function fetchMe(): Promise<{ user: AuthUser }> {
  return request("/api/auth/me");
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  return request("/api/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
