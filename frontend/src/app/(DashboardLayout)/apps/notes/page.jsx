import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import AppCard from "@/app/components/shared/AppCard";
import NotesApp from "@/app/components/apps/notes";
import { NotesProvider } from '@/app/context/NotesContext/index'
const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Notes",
  },
];

export default function Notes() {
  return (
    <NotesProvider>
      <PageContainer title="Note App" description="this is Note App">
        <Breadcrumb title="Note app" items={BCrumb} />
        <AppCard>
          <NotesApp />
        </AppCard>
      </PageContainer>
    </NotesProvider>
  );
}
