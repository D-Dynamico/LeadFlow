import type {
  AddDiscussionResult,
  Discussion,
  DiscussionCreateInput,
  ErrorDetail,
  ErrorEnvelope,
  Lead,
  LeadCreateInput,
  LeadList,
  LeadListParams,
  LeadUpdateInput,
} from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** A non-2xx response, parsed from the API's error envelope (docs/API.md). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ErrorDetail[] | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ErrorEnvelope).error?.code === "string"
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isEnvelope(body)) {
      const { code, message, details } = body.error;
      throw new ApiError(response.status, code, message, details);
    }
    throw new ApiError(response.status, "UNKNOWN_ERROR", "Something went wrong");
  }
  return body as T;
}

const leadPath = (id: string) => `/leads/${encodeURIComponent(id)}`;

export const api = {
  listLeads({ status, q, tz }: LeadListParams): Promise<LeadList> {
    const params = new URLSearchParams({ tz });
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return request<LeadList>(`/leads?${params}`);
  },

  getLead(id: string, tz: string): Promise<Lead> {
    return request<Lead>(`${leadPath(id)}?${new URLSearchParams({ tz })}`);
  },

  createLead(input: LeadCreateInput): Promise<Lead> {
    return request<Lead>("/leads", { method: "POST", body: JSON.stringify(input) });
  },

  updateLead(id: string, input: LeadUpdateInput): Promise<Lead> {
    return request<Lead>(leadPath(id), { method: "PATCH", body: JSON.stringify(input) });
  },

  listDiscussions(id: string): Promise<Discussion[]> {
    return request<Discussion[]>(`${leadPath(id)}/discussions`);
  },

  addDiscussion(id: string, input: DiscussionCreateInput): Promise<AddDiscussionResult> {
    return request<AddDiscussionResult>(`${leadPath(id)}/discussions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  markFollowUpDone(id: string): Promise<void> {
    return request<void>(`${leadPath(id)}/follow-up`, { method: "DELETE" });
  },
};
