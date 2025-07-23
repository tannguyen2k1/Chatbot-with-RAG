import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import AppCard from "@/app/components/shared/AppCard";
import ChatsApp from "@/app/components/apps/chats";
import { ChatProvider } from '@/app/context/ChatContext/index'
const Chats = () => {
  return (
    <ChatProvider>
      <PageContainer title="Chat" description="this is Chat">
        <Breadcrumb title="Chat app" subtitle="Messenger" />
        <AppCard>
          <ChatsApp />
        </AppCard>
      </PageContainer>
    </ChatProvider>
  );
};

export default Chats;
