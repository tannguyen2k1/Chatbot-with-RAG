import React from 'react';
import { Grid, Stack, Typography, Button, Box, Skeleton } from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';

const SkeletonRevenueUpdatesTwoCard = () => {

  return (
    (<DashboardCard>
      <>
        <Box sx={{
          mb: 1
        }}>
          <Skeleton variant="rounded" width={190} height={21} />
        </Box>
        <Skeleton variant="rounded" width={190} height={21} />
        <Grid container spacing={3} sx={{
          mt: 2
        }}>
          {/* column */}
          <Grid
            size={{
              xs: 12,
              sm: 8
            }}>
            <Box className="rounded-bars" sx={{
              height: "360px"
            }}>
              <Skeleton variant="rounded" width={390} height={360} />
            </Box>
          </Grid>
          {/* column */}
          <Grid
            size={{
              xs: 12,
              sm: 4
            }}>
            <Stack direction="row" spacing={2} sx={{
              alignItems: "center"
            }}>
              <Skeleton variant="rounded" width={38} height={38} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: "600"
                  }}>
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                mt: 2
              }}>
              <Skeleton variant="rounded" width={38} height={38} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: "600"
                  }}>
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                mb: 4,
                mt: 2
              }}>
              <Skeleton variant="rounded" width={38} height={38} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: "600"
                  }}>
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  <Skeleton variant="rounded" width={160} height={25} />
                </Typography>
              </Box>
            </Stack>
            <Skeleton variant="rounded" width={90} height={35} />
          </Grid>
        </Grid>
      </>
    </DashboardCard>)
  );
};

export default SkeletonRevenueUpdatesTwoCard;
