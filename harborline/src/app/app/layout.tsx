import { ToastHost } from "@/components/ui";
import WorkspaceShell from "@/components/workspace-shell";

export const metadata = { title: "Workspace" };

// Authenticated shell: sidebar + top bar + content. Guarding happens per page
// (server currentUser) so unauthenticated users bounce to /login?next=…
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastHost>
      <WorkspaceShell>{children}</WorkspaceShell>
    </ToastHost>
  );
}
