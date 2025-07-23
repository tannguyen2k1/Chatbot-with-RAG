import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import { Grid } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import React from 'react';

const StillQuestions = () => {
  return (
    (<Grid container spacing={3} sx={{
      justifyContent: "center"
    }}>
      <Grid
        size={{
          xs: 12,
          lg: 10
        }}>
        <Box
          sx={{
            bgcolor: "primary.light",
            p: 5,
            mt: 7
          }}>
          <Stack>
            <AvatarGroup sx={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Avatar alt="Remy Sharp" src={"/images/profile/user-1.jpg"} />
              <Avatar alt="Travis Howard" src={"/images/profile/user-2.jpg"} />
              <Avatar alt="Cindy Baker" src={"/images/profile/user-3.jpg"} />
            </AvatarGroup>
          </Stack>

          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              mt: 3,
              mb: 1
            }}>
            Still have questions
          </Typography>
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{
              fontWeight: 400,
              lineHeight: "23px",
              textAlign: "center"
            }}>
            Can&apos;t find the answer your&apos;re looking for ? Please chat to our friendly team.
          </Typography>
          <Box
            sx={{
              textAlign: "center",
              mt: 3
            }}>
            <Button variant="contained" color="primary">
              Chat with us
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>)
  );
};

export default StillQuestions;
