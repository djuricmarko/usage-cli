export interface ApiClientOptions {
  token: string;
  baseUrl?: string;
}

export class ApiClient {
  private token: string;
  private baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? "https://api.github.com";
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ApiError(response.status, response.statusText, body, path);
    }

    return (await response.json()) as T;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
    public readonly path: string
  ) {
    super(`API Error ${status} ${statusText} for ${path}`);
    this.name = "ApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  getUserMessage(): string {
    if (this.isUnauthorized) {
      return "Authentication failed. Run: gh auth login";
    }
    if (this.isForbidden) {
      return (
        "Insufficient permissions. Your token may need additional scopes.\n" +
        "Try: gh auth refresh -s read:user"
      );
    }
    if (this.isNotFound) {
      return (
        "Resource not found. This endpoint may not be available for your account.\n" +
        "The billing API requires the enhanced billing platform."
      );
    }
    return `API request failed: ${this.status} ${this.statusText}`;
  }
}
