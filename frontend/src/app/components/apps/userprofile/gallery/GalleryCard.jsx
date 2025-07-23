"use client";
import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import { Grid } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BlankCard from "../../../shared/BlankCard";
import { UserDataContext } from "@/app/context/UserDataContext/index";
import { IconDotsVertical, IconSearch } from "@tabler/icons-react";
import { format } from "date-fns";

import FsLightbox from "fslightbox-react";

const GalleryCard = () => {
  const { gallery } = useContext(UserDataContext);
  const [search, setSearch] = React.useState('');

  const filterPhotos = (photos, cSearch) => {
    if (photos)
      return photos.filter((t) => t.name.toLocaleLowerCase().includes(cSearch.toLocaleLowerCase()));

    return photos;
  };

  const getPhotos = filterPhotos(gallery, search);

  // skeleton
  const [isLoading, setLoading] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const [toggler, setToggler] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const openLightbox = (image) => {
    setCurrentImage(image);
    setToggler((prev) => !prev);
  };

  return (<>
    <Grid container spacing={3}>
      <Grid
        size={{
          sm: 12,
          lg: 12
        }}>
        <Stack direction="row" alignItems={"center"} mt={2}>
          <Box>
            <Typography variant="h3">
              Gallery &nbsp;
              <Chip label={getPhotos.length} color="secondary" size="small" />
            </Typography>
          </Box>
          <Box ml="auto">
            <TextField
              id="outlined-search"
              placeholder="Search Gallery"
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

                htmlInput: { "aria-label": "Search Gallery" }
              }} />
          </Box>
        </Stack>
      </Grid>
      {getPhotos.map((photo) => {
        return (
          (<Grid
            key={photo.id}
            size={{
              xs: 12,
              lg: 4
            }}>
            <BlankCard className="hoverCard">
              {isLoading ? (
                <>
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height={220}
                  ></Skeleton>
                </>
              ) : (
                <CardMedia
                  component={"img"}
                  height="220"
                  alt="Remy Sharp"
                  src={photo.cover}
                  onClick={() => openLightbox(photo.cover)} sx={{ cursor: 'pointer' }}
                />
              )}
              <Box p={3}>
                <Stack direction="row" gap={1}>
                  <Box>
                    <Typography variant="h6">{photo.name}jpg</Typography>
                    <Typography variant="caption">
                      {format(new Date(photo.time), "E, MMM d, yyyy")}
                    </Typography>
                  </Box>
                  <Box ml={"auto"}>
                    <IconButton>
                      <IconDotsVertical size="16" />
                    </IconButton>
                  </Box>
                </Stack>
              </Box>
            </BlankCard>
          </Grid>)
        );
      })}
    </Grid>
    {/* FSLightbox component */}
    <FsLightbox toggler={!toggler} sources={currentImage ? [currentImage] : []} />
  </>);
};

export default GalleryCard;
