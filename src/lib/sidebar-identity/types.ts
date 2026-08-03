import type { Component } from "svelte";

export type SidebarWorkspace = {
  id: string;
  name: string;
  description?: string | null;
};

export type SidebarWorkspaceManagementAction = {
  href: string;
  label: string;
};

export type SidebarUser = {
  avatarUrl?: string | null;
  email: string;
  name: string;
};

export type SidebarUserMenuItem = {
  icon: Component;
  id: string;
  label: string;
  onSelect?: () => void;
};
