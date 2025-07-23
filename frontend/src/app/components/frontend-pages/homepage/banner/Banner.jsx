'use client';
import React from "react";
import { Box, Stack, Typography, AvatarGroup, Avatar, Container, Grid, Button, Link } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import Image from "next/image";
import Tooltip from '@mui/material/Tooltip';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const Frameworks = [
    {
        name: 'React',
        icon: '/images/frontend-pages/icons/icon-react.svg'
    },
    {
        name: 'Material Ui',
        icon: '/images/frontend-pages/icons/icon-mui.svg'
    },
    {
        name: 'Next.js',
        icon: '/images/frontend-pages/icons/icon-next.svg'
    },
    {
        name: 'Typescript',
        icon: '/images/frontend-pages/icons/icon-ts.svg'
    },
    {
        name: 'Redux',
        icon: '/images/frontend-pages/icons/icon-redux.svg'
    },
    {
        name: 'Tabler Icon',
        icon: '/images/frontend-pages/icons/icon-tabler.svg'
    },
];
const Banner = () => {

    //   sidebar
    const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));

    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        (<Box
            sx={{
                bgcolor: "primary.light",
                pt: 7
            }}>
            <Container sx={{
                maxWidth: '1400px !important', position: "relative"
            }}>
                <Grid
                    container
                    spacing={3}
                    sx={{
                        justifyContent: "center",
                        mb: 4
                    }}>
                    {lgUp ? <Grid
                        size={{
                            xs: 12,
                            lg: 2
                        }}
                        sx={{
                            alignItems: "end",
                            display: "flex"
                        }}>
                        <Image src="/images/frontend-pages/homepage/banner-top-left.svg" className="animted-img-2" alt="banner" width={360} height={200} style={{
                            borderRadius: '16px', position: 'absolute', left: '24px', boxShadow: (theme) => theme.shadows[10], height: 'auto', width: "auto"
                        }} />
                    </Grid> : null}

                    <Grid
                        size={{
                            xs: 12,
                            lg: 7
                        }}
                        sx={{
                            textAlign: "center"
                        }}>
                        <Typography
                            variant="h1"
                            sx={{
                                fontWeight: 700,
                                lineHeight: "1.2",

                                fontSize: {
                                    xs: '40px', sm: '56px'
                                }
                            }}>Most powerful & <Typography
                                variant="h1"
                                component="span"
                                sx={{
                                    fontWeight: 700,
                                    color: "primary.main",

                                    fontSize: {
                                        xs: '40px', sm: '56px'
                                    }
                                }}>developer friendly</Typography> dashboard</Typography>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing="20px"
                            sx={{
                                my: 3,
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                            <AvatarGroup>
                                <Avatar alt="Remy Sharp" src='/images/profile/user-1.jpg' sx={{ width: 40, height: 40 }} />
                                <Avatar alt="Travis Howard" src='/images/profile/user-2.jpg' sx={{ width: 40, height: 40 }} />
                                <Avatar alt="Cindy Baker" src='/images/profile/user-3.jpg' sx={{ width: 40, height: 40 }} />
                            </AvatarGroup>
                            <Typography variant="h6" sx={{
                                fontWeight: 500
                            }}>52,589+
                                developers & agencies using our templates
                            </Typography>
                        </Stack>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={3}
                            sx={{
                                alignItems: "center",
                                mb: 4,
                                justifyContent: "center"
                            }}>
                            <Button color="primary" size="large" variant="contained" href="/auth/auth1/login"> Log In</Button>
                            <Button
                                variant="text"
                                color="inherit"
                                onClick={handleClickOpen}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    color: 'text.primary',
                                    fontWeight: 500,
                                    fontSize: '15px',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            ><Image src="/images/frontend-pages/homepage/icon-play.svg" alt="icon" width={40} height={40} /> See how it works</Button>

                            <Dialog
                                maxWidth="lg"
                                open={open}
                                onClose={handleClose}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                            >
                                <DialogContent>
                                    <iframe
                                        width="800"
                                        height="500"
                                        src="https://www.youtube.com/embed/P94DBd1hJkw?si=WLnH9g-KAdDJkUZN"
                                        title="YouTube video player"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    ></iframe>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleClose} autoFocus>
                                        Close
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Stack>
                        <Stack
                            direction="row"
                            useflexgap="true"
                            spacing={3}
                            sx={{
                                flexWrap: "wrap",
                                alignItems: "center",
                                mb: 8,
                                justifyContent: "center"
                            }}>
                            {Frameworks.map((fw, i) => (
                                <Tooltip title={fw.name} key={i}>
                                    <Box
                                        sx={{
                                            width: "54px",
                                            height: "54px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: "16px",

                                            boxShadow: (theme) =>
                                                theme.palette.mode === 'dark' ? null : (theme) => theme.shadows[10],

                                            backgroundColor: (theme) =>
                                                theme.palette.mode === 'dark' ? '#1f2c4f' : 'white'
                                        }}>
                                        <Image src={fw.icon} alt={fw.icon} width={26} height={26} />
                                    </Box>
                                </Tooltip>
                            ))}

                        </Stack>
                    </Grid>
                    {lgUp ? <Grid
                        size={{
                            xs: 12,
                            lg: 2
                        }}
                        sx={{
                            alignItems: "end",
                            display: "flex"
                        }}>
                        <Image src="/images/frontend-pages/homepage/banner-top-right.svg" className="animted-img-2" alt="banner" width={350} height={220} style={{
                            borderRadius: '16px', position: 'absolute', right: '24px', boxShadow: (theme) => theme.shadows[10], height: 'auto', width: "auto"
                        }} />
                    </Grid> : null}

                </Grid>

                {lgUp ? <Image src="/images/frontend-pages/homepage/bottom-part.svg" alt="banner" width={500} height={300} style={{
                    width: '100%', marginBottom: '-11px'
                }} /> : null}

            </Container>
        </Box>)
    );
};

export default Banner;
