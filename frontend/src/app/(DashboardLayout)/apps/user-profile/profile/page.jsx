import { Grid } from '@mui/material'
import PageContainer from '@/app/components/container/PageContainer';

import ProfileBanner from '@/app/components/apps/userprofile/profile/ProfileBanner';
import IntroCard from '@/app/components/apps/userprofile/profile/IntroCard';
import PhotosCard from '@/app/components/apps/userprofile/profile/PhotosCard';
import Post from '@/app/components/apps/userprofile/profile/Post';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { UserDataProvider } from '@/app/context/UserDataContext';


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
    <UserDataProvider>
      <PageContainer title="Profile" description="this is Profile">
        <Breadcrumb title="User App" items={BCrumb} />
        <Grid container spacing={3}>
          <Grid
            size={{
              sm: 12
            }}>
            <ProfileBanner />
          </Grid>

          {/* intro and Photos Card */}
          <Grid
            size={{
              sm: 12,
              lg: 4,
              xs: 12
            }}>
            <Grid container spacing={3}>
              <Grid
                size={{
                  sm: 12
                }}>
                <IntroCard />
              </Grid>
              <Grid
                size={{
                  sm: 12
                }}>
                <PhotosCard />
              </Grid>
            </Grid>
          </Grid>
          {/* Posts Card */}
          <Grid
            size={{
              sm: 12,
              lg: 8,
              xs: 12
            }}>
            <Post />
          </Grid>
        </Grid>
      </PageContainer>
    </UserDataProvider>
  );
};

export default UserProfile;
