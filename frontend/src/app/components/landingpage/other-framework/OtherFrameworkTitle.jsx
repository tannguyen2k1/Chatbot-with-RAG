'use client';
import React from 'react';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';


const OtherFrameworkTitle = () => {

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
                    }}>Technology Offerings</Typography>
                <Typography
                    variant="body1"
                    sx={{
                        textAlign: "center",
                        mt: 4
                    }}>Modernize across a variety of technologies. Simply select to drive in and find the ideal solution tailored to your requirements. <Typography component="span" sx={{
                        color: "primary.main"
                    }}>Note that each option is sold seprately.</Typography></Typography>
            </Grid>
        </Grid>)
    );
};

export default OtherFrameworkTitle;
