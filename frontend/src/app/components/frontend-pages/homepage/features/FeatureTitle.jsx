'use client';
import React from "react";
import { Box, Grid, Typography, Link, Chip } from "@mui/material";


const FeatureTitle = () => {
    return (
        (<Grid container spacing={3} sx={{
            justifyContent: "center"
        }}>
            <Grid
                size={{
                    xs: 12,
                    lg: 6
                }}
                sx={{
                    textAlign: "center"
                }}>
                <Typography variant="body1">Introducing Modernize's Light & Dark Skins, <Box component="span" sx={{
                    fontWeight: 500
                }}>Exceptional Dashboards</Box>, and <br />Dynamic Pages - Stay Updated on What's New!</Typography>
            </Grid>
        </Grid>)
    );
};

export default FeatureTitle;
