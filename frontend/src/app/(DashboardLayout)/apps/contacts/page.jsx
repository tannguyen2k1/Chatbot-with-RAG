import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import AppCard from "@/app/components/shared/AppCard";
import ContactApp from "@/app/components/apps/contacts/index";
import { ContactContextProvider } from '@/app/context/Conatactcontext/index'
const Contacts = () => {
  return (
    <ContactContextProvider>
      <PageContainer title="Contact" description="this is Contact">
        <Breadcrumb title="Contact app" subtitle="List Your Contacts" />
        <AppCard>
          <ContactApp />
        </AppCard>
      </PageContainer>
    </ContactContextProvider>
  );
};

export default Contacts;
