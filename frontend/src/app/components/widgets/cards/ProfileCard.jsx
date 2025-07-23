'use client'
import React from 'react';
import { CardContent, Typography, Grid, IconButton, Divider, Avatar, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Stack } from '@mui/system';
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandTwitter,
} from '@tabler/icons-react';
import BlankCard from '../../shared/BlankCard';

const SocialIcons = [
  {
    name: 'Facebook',
    icon: <IconBrandFacebook size="18" color="#1877F2" />,
  },
  {
    name: 'Instagram',
    icon: <IconBrandInstagram size="18" color="#D7336D" />,
  },
  {
    name: 'Github',
    icon: <IconBrandGithub size="18" color="#006097" />,
  },
  {
    name: 'Twitter',
    icon: <IconBrandTwitter size="18" color="#1C9CEA" />,
  },
];

const profileCard = [
  {
    name: 'Andrew Grant',
    role: 'Technology Director',
    avatar: "/images/profile/user-1.jpg",
  },
  {
    name: 'Leo Pratt',
    role: 'Telecom Analyst',
    avatar: "/images/profile/user-2.jpg",
  },
  {
    name: 'Charles Nunez',
    role: 'Environmental Specialist',
    avatar: "/images/profile/user-3.jpg",
  },
];

const ProfileCard = () => {
  const theme = useTheme();

  return (
    (<Grid container spacing={3}>
      {profileCard.map((card, index) => (
        <Grid
          key={index}
          size={{
            xs: 12,
            sm: 4
          }}>
          <BlankCard>
            <CardContent>
              <Stack
                direction={'column'}
                sx={{
                  gap: 2,
                  alignItems: "center"
                }}>
                <Avatar alt="Remy Sharp" src={card.avatar} sx={{ width: '80px', height: '80px' }} />
                <Box sx={{
                  textAlign: 'center'
                }}>
                  <Typography variant="h5">{card.name}</Typography>
                  <Typography variant="caption">{card.role}</Typography>
                </Box>
              </Stack>
            </CardContent>
            <Divider />
            <Box
              sx={{
                p: 2,
                py: 1,
                textAlign: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'grey.100'
              }}>
              {SocialIcons.map((sicon) => {
                return <IconButton key={sicon.name}>{sicon.icon}</IconButton>;
              })}
            </Box>
          </BlankCard>
        </Grid>
      ))}
    </Grid>)
  );
};

export default ProfileCard;
