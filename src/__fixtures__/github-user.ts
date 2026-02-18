import type { GitHubUser } from "../types.js";

export const freeUser: GitHubUser = {
  login: "testuser",
  name: "Test User",
  email: "test@example.com",
  plan: {
    name: "free",
    space: 976562499,
    collaborators: 0,
    private_repos: 0,
  },
};

export const proUser: GitHubUser = {
  login: "prouser",
  name: "Pro User",
  email: "pro@example.com",
  plan: {
    name: "pro",
    space: 976562499,
    collaborators: 0,
    private_repos: 9999,
  },
};

export const userWithoutPlan: GitHubUser = {
  login: "noplanuser",
  name: "No Plan User",
  email: null,
};

export const enterpriseUser: GitHubUser = {
  login: "entuser",
  name: "Enterprise User",
  email: "ent@example.com",
  plan: {
    name: "enterprise",
    space: 976562499,
    collaborators: 0,
    private_repos: 9999,
  },
};
