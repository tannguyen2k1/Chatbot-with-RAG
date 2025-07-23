'use client'
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { Grid } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useContext, useEffect } from 'react';
import BlankCard from '../../../shared/BlankCard';
import { UserDataContext } from "@/app/context/UserDataContext/index";
import { IconMapPin, IconSearch } from '@tabler/icons-react';

const FollowerCard = () => {
  const { followers, toggleFollow, setSearch } = useContext(UserDataContext);



  return (
    <>
      <Grid container spacing={3}>
        <Grid
          size={{
            sm: 12,
            lg: 12
          }}>
          <Stack direction="row" alignItems={'center'} mt={2}>
            <Box>
              <Typography variant="h3">
                Followers &nbsp;
                <Chip label={followers.length} color="secondary" size="small" />
              </Typography>
            </Box>
            <Box ml="auto">
              <TextField
                id="outlined-search"
                placeholder="Search Followers"
                size="small"
                type="search"
                variant="outlined"
                fullWidth
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size="14" />
                      </InputAdornment>
                    ),
                  },

                  htmlInput: { 'aria-label': 'Search Followers' }
                }} />
            </Box>
          </Stack>
        </Grid>
        {followers.map((profile) => {
          return (
            (<Grid
              key={profile.id}
              size={{
                xs: 12,
                lg: 4
              }}>
              <BlankCard>
                <CardContent>
                  <Stack direction={'row'} gap={2} alignItems="center">
                    <Avatar alt="Remy Sharp" src={profile.avatar} />
                    <Box>
                      <Typography variant="h6" textOverflow={'ellipsis'} noWrap>{profile.name}</Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <IconMapPin size="14" />
                        {profile.country}
                      </Typography>
                    </Box>
                    <Box ml="auto">
                      {profile.isFollowed ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => toggleFollow(profile.id)}
                        >
                          Followed
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => toggleFollow(profile.id)}
                        >
                          Follow
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </BlankCard>
            </Grid>)
          );
        })}
      </Grid>
    </>
  );
};

export default FollowerCard;
