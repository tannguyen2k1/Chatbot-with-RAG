'use client'
import { Card, CardContent, Typography, Button, Box, Grid } from '@mui/material';
import Image from 'next/image';

const Banner1 = () => {
  return (
    (<Card
        elevation={0}
        sx={{
          backgroundColor: (theme) => theme.palette.secondary.light,
          py: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
      <CardContent sx={{ p: '30px' }}>
        <Grid container spacing={3} sx={{
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
            <Box
              sx={{
                textAlign: {
                  xs: 'center',
                  sm: 'left',
                },
              }}
            >
              <Typography variant="h5">Track your every Transaction Easily</Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{
                my: 2
              }}>
                Track and record your every income and expence easily to control your balance
              </Typography>
              <Button variant="contained" color="secondary">
                Download
              </Button>
            </Box>
          </Grid>
          <Grid
            size={{
              sm: 4
            }}>
            <Box sx={{
              mb: "-150px"
            }}>
              <Image src={"/images/backgrounds/track-bg.png"} alt={"trackBg"} height={195} width={168} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>)
  );
};

export default Banner1;
