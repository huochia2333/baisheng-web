import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";
import { WorkspaceLoadingShell } from "@/components/dashboard/workspace-loading-shell";

export default function Loading() {
  return (
    <ScopedIntlProvider
      namespaces={["WorkspaceLoadingShell", "WorkspaceLoadingTitles"]}
    >
      <WorkspaceLoadingShell />
    </ScopedIntlProvider>
  );
}
