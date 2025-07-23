import { Grid } from '@mui/material'
import PageContainer from '@/app/components/container/PageContainer';
import ProfileBanner from '@/app/components/apps/userprofile/profile/ProfileBanner';
import GalleryCard from '@/app/components/apps/userprofile/gallery/GalleryCard';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { UserDataProvider } from '@/app/context/UserDataContext';


const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Gallery',
  },
]
const Gallery = () => {
  return (
    <UserDataProvider>
      <PageContainer title="Gallery" description="this is Gallery">
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
            <GalleryCard />
          </Grid>
        </Grid>
      </PageContainer>
    </UserDataProvider>
  );
};

export default Gallery;
