import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/page-title";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageTitle eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        title="Datenanbindung folgt"
        description="Die Navigationsstruktur und die Seite sind bereits vorbereitet. Die finale Dataverse-Logik kann hier später ohne größeren Umbau ergänzt werden."
      />
    </div>
  );
}
