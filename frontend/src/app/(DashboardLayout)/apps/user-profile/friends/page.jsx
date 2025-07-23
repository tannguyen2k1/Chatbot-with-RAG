import { Grid } from '@mui/material'
import PageContainer from '@/app/components/container/PageContainer';
import ProfileBanner from '@/app/components/apps/userprofile/profile/ProfileBanner';
import FriendsCard from '@/app/components/apps/userprofile/friends/FriendsCard';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { UserDataProvider } from '@/app/context/UserDataContext';



const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Friends',
  },
]

const Friends = () => {
  return (
    <UserDataProvider>
      <PageContainer title="Friends" description="this is Friends">
        <Breadcrumb title="User App" items={BCrumb} />
        <Grid container spacing={3}>
          <Grid
            size={{
              sm: 12
            }}>
            <ProfileBanner />
          </Grid>
          <Grid
            size={{
              sm: 12
            }}>
            <FriendsCard />
          </Grid>
        </Grid>
      </PageContainer>
    </UserDataProvider>
  );
};

export default Friends;
