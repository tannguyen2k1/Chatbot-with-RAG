import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { Grid } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import * as dropdownData from './data';
import Link from 'next/link';
import React from 'react';

const AppLinks = () => {
  return (
    (<Grid container spacing={3} sx={{
      mb: 4
    }}>
      {dropdownData.appsLink.map((links, index) => (
        <Grid
          key={index}
          size={{
            lg: 6
          }}>
          <Link href={links.href} className="hover-text-primary">
            <Stack direction="row" spacing={2}>
              <Box
                sx={{
                  minWidth: "45px",
                  height: "45px",
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                <Avatar
                  src={links.avatar}
                  alt={links.avatar}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 0,
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textPrimary"
                  noWrap
                  className="text-hover"
                  sx={{
                    fontWeight: 600,
                    width: '240px'
                  }}>
                  {links.title}
                </Typography>
                <Typography
                  color="textSecondary"
                  variant="subtitle2"
                  noWrap
                  sx={{
                    fontSize: "12px",
                    width: '240px'
                  }}>
                  {links.subtext}
                </Typography>
              </Box>
            </Stack>
          </Link>
        </Grid>
      ))}
    </Grid>)
  );
};

export default AppLinks;
