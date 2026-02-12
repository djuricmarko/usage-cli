import type { ApiClient } from "../api.js";
import type { GitHubUser } from "../types.js";

export async function getAuthenticatedUser(client: ApiClient): Promise<GitHubUser> {
  return client.get<GitHubUser>("/user");
}
