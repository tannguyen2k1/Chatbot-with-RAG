'use client';
import React from 'react';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';

const FeaturesTitle = () => {
  return (
    (<Grid container spacing={3} sx={{
      justifyContent: "center"
    }}>
      <Grid
        size={{
          xs: 12,
          sm: 10,
          lg: 6
        }}>
        <Typography
          sx={{
            fontSize: "16",
            textTransform: "uppercase",
            color: "primary.main",
            fontWeight: 500,
            textAlign: "center",
            mb: 1
          }}>
          ALMOST COVERED EVERYTHING
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            textAlign: "center",

            fontSize: {
              lg: '36px',
              xs: '25px',
            },

            lineHeight: {
              lg: '43px',
              xs: '30px',
            }
          }}>
          Other Amazing Features & Flexibility Provided
        </Typography>
      </Grid>
    </Grid>)
  );
};

export default FeaturesTitle;
