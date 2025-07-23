'use client';
import React from 'react';
import { Box, Avatar, Typography, Card, CardContent, Grid, Divider, Stack } from '@mui/material';
import { IconArrowUpRight } from '@tabler/icons-react';
import Image from 'next/image';

const WelcomeCard = () => {
  return (
    (<Card elevation={0} sx={{ backgroundColor: (theme) => theme.palette.primary.light, py: 0, position: "relative" }}>
      <CardContent sx={{ py: 4, px: 2 }}>
        <Grid container sx={{
          justifyContent: "space-between"
        }}>
          <Grid
            size={{
              sm: 6
            }}
            sx={{
              display: "flex",
              alignItems: "center"
            }}>
            <Box>
              <Box
                sx={{
                  gap: "16px",
                  mb: 5,

                  display: {
                    xs: 'block',
                    sm: 'flex',
                  },

                  alignItems: 'center'
                }}>
                <Avatar src='/images/profile/user-1.jpg' alt="img" sx={{ width: 40, height: 40 }} />
                <Typography variant="h5" sx={{
                  whiteSpace: "nowrap"
                }}>
                  Welcome back Mathew Anderson!
                </Typography>
              </Box>

              <Stack spacing={2} direction="row" divider={<Divider orientation="vertical" flexItem />} sx={{
                mt: 8
              }}>
                <Box>
                  <Typography variant="h2" sx={{
                    whiteSpace: "nowrap"
                  }}>$2,340 <span><IconArrowUpRight width={18} color="#39B69A" /></span></Typography>
                  <Typography variant="subtitle1" sx={{
                    whiteSpace: "nowrap"
                  }}>Today’s Sales</Typography>
                </Box>
                <Box>
                  <Typography variant="h2" sx={{
                    whiteSpace: "nowrap"
                  }}>35%<span><IconArrowUpRight width={18} color="#39B69A" /></span></Typography>
                  <Typography variant="subtitle1" sx={{
                    whiteSpace: "nowrap"
                  }}>Performance</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
          <Grid
            size={{
              sm: 6
            }}>
            <Box sx={{
              mb: "-51px"
            }}>
              <Image src='/images/backgrounds/welcome-bg2.png' alt='img' width={340} height={204} style={{ width: "340px", height: "246px", position: "absolute", right: '-26px', bottom: '-70px', marginTop: '20px' }} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>)
  );
};

export default WelcomeCard;
