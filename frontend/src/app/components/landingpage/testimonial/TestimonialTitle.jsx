'use client';
import React from 'react';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import AnimationFadeIn from '../animation/Animation';

const TestimonialTitle = () => {
  return (
    (<Grid container spacing={3} sx={{
      justifyContent: "center"
    }}>
      <Grid
        size={{
          xs: 12,
          sm: 10,
          lg: 8
        }}>
        <AnimationFadeIn>
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
            Don’t just take our words for it, See what developers like you are saying
          </Typography>
        </AnimationFadeIn>
      </Grid>
    </Grid>)
  );
};

export default TestimonialTitle;
