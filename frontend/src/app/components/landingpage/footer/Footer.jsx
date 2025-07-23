'use client';
import React from 'react';
import Container from '@mui/material/Container';
import { Grid } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

const Footer = () => {
  return (
    (<Container maxWidth="lg">
      <Grid
        container
        spacing={3}
        sx={{
          justifyContent: "center",
          mt: 4
        }}>
        <Grid
          size={{
            xs: 12,
            sm: 5,
            lg: 4
          }}
          sx={{
            textAlign: "center"
          }}>
          <Image src='/images/logos/logoIcon.svg' alt="icon" width={35} height={35} />
          <Typography
            color="textSecondary"
            sx={{
              fontSize: "16",
              mt: 1,
              mb: 4
            }}>
            All rights reserved by Modernize. Designed & Developed by
            <Link target="_blank" href="https://adminmart.com/">
              <Typography color="textSecondary" component="span" sx={{
                display: "inline"
              }}>
                {' '}
                AdminMart
              </Typography>{' '}
            </Link>
            .
          </Typography>
        </Grid>
      </Grid>
    </Container>)
  );
};

export default Footer;
