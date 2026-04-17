import { WorkspaceLoadingShell } from "@/components/dashboard/workspace-loading-shell";
import { ScopedIntlProvider } from "@/components/i18n/scoped-intl-provider";

export default function WorkspaceLoading() {
  return (
    <ScopedIntlProvider
      namespaces={["WorkspaceLoadingShell", "WorkspaceLoadingTitles"]}
    >
      <WorkspaceLoadingShell />
    </ScopedIntlProvider>
  );
}
