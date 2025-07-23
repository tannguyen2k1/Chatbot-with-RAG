import * as React from 'react';
import { Grid } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import ParentCard from '@/app/components/shared/ParentCard';

import { IconHeart, IconPhone, IconUser } from '@tabler/icons-react';
import TabText from '@/app/components/ui-components/tabs/TabText';
import TabIcon from '@/app/components/ui-components/tabs/TabIcon';
import TabIconLabel from '@/app/components/ui-components/tabs/TabIconLabel';
import TabIconBottom from '@/app/components/ui-components/tabs/TabIconBottom';
import TabIconLeft from '@/app/components/ui-components/tabs/TabIconLeft';
import TabIconRight from '@/app/components/ui-components/tabs/TabIconRight';
import TabScrollable from '@/app/components/ui-components/tabs/TabScrollable';
import TabVertical from '@/app/components/ui-components/tabs/TabVertical';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Tabs',
  },
];


const MuiTabs = () => {

  return (
    (<PageContainer title="Tabs" description="this is Tabs">
      {/* breadcrumb */}
      <Breadcrumb title="Tabs" items={BCrumb} />
      {/* end breadcrumb */}
      <ParentCard title="Tabs">
        <Grid container spacing={3}>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Text */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabText />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Icon */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabIcon />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Icon with Label */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabIconLabel />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Icon Bottom */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabIconBottom />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Icon Left */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabIconLeft />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Icon Right */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabIconRight />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Scrollable  */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabScrollable />
          </Grid>
          {/* ---------------------------------------------------------------------------------- */}
          {/* Vertical */}
          {/* ---------------------------------------------------------------------------------- */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "stretch"
            }}>
            <TabVertical />
          </Grid>
        </Grid>
      </ParentCard>
    </PageContainer>)
  );
};
export default MuiTabs;
