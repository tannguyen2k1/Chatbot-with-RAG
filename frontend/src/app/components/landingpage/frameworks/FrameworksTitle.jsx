'use client';
import React from 'react';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';


const FrameworksTitle = () => {

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
                <Typography
                    variant='h2'
                    sx={{
                        fontWeight: 700,
                        textAlign: "center",

                        fontSize: {
                            lg: '36px',
                            xs: '25px'
                        },

                        lineHeight: {
                            lg: '43px',
                            xs: '30px'
                        }
                    }}>Increase speed of your development and
                    launch quickly with Modernize</Typography>
            </Grid>
        </Grid>)
    );
};

export default FrameworksTitle;
