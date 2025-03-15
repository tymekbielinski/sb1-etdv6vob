import { useTeamStore } from '@/lib/store/team-store';
import { TemplateGallery } from '@/components/dashboard/template-gallery';

export default function TemplatesPage() {
  const { team } = useTeamStore();
  const teamName = team?.name || 'Personal';
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{teamName} Dashboards</h1>
        <p className="text-muted-foreground">Browse and manage your dashboard templates</p>
      </div>
      <TemplateGallery />
    </div>
  );
}
