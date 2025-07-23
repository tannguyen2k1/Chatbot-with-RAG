import PageContainer from '@/app/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import UserInfoCard from '@/app/components/apps/userprofile/profile/UserInfoCard';


const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'UserProfile',
  },
]

const UserProfile = () => {
  return (
      <PageContainer title="Profile" description="User profile from backend">
        <Breadcrumb title="User App" items={BCrumb} />
        <UserInfoCard />
      </PageContainer>
  );
};

export default UserProfile;
