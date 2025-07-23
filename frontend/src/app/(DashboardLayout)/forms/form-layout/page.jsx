
import { Grid } from '@mui/material';
import {
  FbOrdinaryForm,
  FbDefaultForm,
  FbBasicHeaderForm,
  FbReadonlyForm,
  FbDisabledForm,
  FbLeftIconForm,
  FbRightIconForm,
  FbInputVariants,
} from '@/app/components/forms/form-layouts/index';
import PageContainer from '@/app/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Form Layouts',
  },
];

const FormLayouts = () => (
  <PageContainer title="Form Layout" description="this is Form Layout">
    {/* breadcrumb */}
    <Breadcrumb title="Form Layouts" items={BCrumb} />
    {/* end breadcrumb */}

    <Grid container spacing={3}>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbOrdinaryForm />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbInputVariants />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbDefaultForm />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbBasicHeaderForm />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbReadonlyForm />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12
        }}>
        <FbDisabledForm />
      </Grid>
      <Grid
        size={{
          lg: 6,
          md: 12,
          xs: 12
        }}>
        <FbLeftIconForm />
      </Grid>
      <Grid
        size={{
          lg: 6,
          md: 12,
          xs: 12
        }}>
        <FbRightIconForm />
      </Grid>
    </Grid>
  </PageContainer>
);

export default FormLayouts;
