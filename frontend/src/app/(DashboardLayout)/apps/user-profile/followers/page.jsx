import { Grid } from '@mui/material'
import PageContainer from '@/app/components/container/PageContainer';
import ProfileBanner from '@/app/components/apps/userprofile/profile/ProfileBanner';
import FollowerCard from '@/app/components/apps/userprofile/followers/FollowerCard';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { UserDataProvider } from '@/app/context/UserDataContext';


const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Followers',
  },
]
const Followers = () => {
  return (
    <UserDataProvider>
      <PageContainer title="Followers" description="this is Followers">
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
            <FollowerCard />
          </Grid>
        </Grid>
      </PageContainer>
    </UserDataProvider>
  );
};

export default Followers;
