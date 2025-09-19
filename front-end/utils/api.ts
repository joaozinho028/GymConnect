// frontend/utils/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Função genérica para requisições GET
 */
export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na API");
  return data;
}

/**
 * Função genérica para requisições POST
 */
export async function apiPost(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na API");
  return data;
}

/**
 * Função genérica para requisições PUT
 */
export async function apiPut(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na API");
  return data;
}

/**
 * Função genérica para requisições DELETE
 */
export async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na API");
  return data;
}
