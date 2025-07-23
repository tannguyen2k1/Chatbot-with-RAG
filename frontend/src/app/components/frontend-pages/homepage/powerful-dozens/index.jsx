'use client';
import React from "react";
import { Box, Grid, Typography, Container } from "@mui/material";
import DozensCarousel from "./DozensCarousel";

const features = [
    {
        title: 'High Customizability',
        subtext: 'Tailor the dashboard to your exact needs. Customize layouts, color schemes, and widgets effortlessly for a personalized user experience.'
    },
    {
        title: 'Powerful Data Analytics',
        subtext: 'Unlock the true potential of your data with our advanced analytics tools. Gain valuable insights and make data-driven decisions with ease.'
    },
    {
        title: 'Interactive Charts',
        subtext: 'Visualize complex data sets beautifully with our interactive graphs and charts. Quickly grasp trends and patterns for smarter analysis.'
    },
]

const PowerfulDozens = () => {
    return (<>
        <Container sx={{
            maxWidth: '1400px !important', mt: {
                xs: '40px',
                lg: '90px',
            }
        }}>
            <Box
                sx={{
                    bgcolor: "primary.light",
                    borderRadius: "24px",

                    py: {
                        xs: '40px',
                        lg: '70px'
                    }
                }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3} sx={{
                        alignItems: "center"
                    }} >
                        <Grid
                            size={{
                                xs: 12,
                                lg: 6,
                                sm: 9
                            }}>
                            <Typography
                                variant="h4"
                                sx={{
                                    mb: "55px",
                                    fontWeight: 700,
                                    fontSize: "40px",
                                    lineHeight: "1.3",

                                    fontSize: {
                                        lg: '40px',
                                        xs: '35px'
                                    }
                                }}>Discover Powerful Dozens of Purpose-Fit Templates</Typography>
                        </Grid>
                    </Grid>
                </Container>
                <DozensCarousel />
                <Container maxWidth="lg">
                    <Grid container spacing={3} sx={{
                        mt: 5
                    }}>
                        {features.map((feature, i) => (
                            <Grid
                                key={i}
                                size={{
                                    xs: 12,
                                    lg: 4,
                                    sm: 4
                                }}
                                sx={{
                                    textAlign: "center"
                                }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        mb: "16px",
                                        fontWeight: 700,

                                        fontSize: {
                                            xs: '17px'
                                        }
                                    }}>{feature.title}</Typography>
                                <Typography variant="body1" sx={{
                                    lineHeight: "28px"
                                }}>{feature.subtext}</Typography>
                            </Grid>
                        ))}

                    </Grid>

                </Container>

            </Box>
        </Container>
    </>);
};

export default PowerfulDozens;
