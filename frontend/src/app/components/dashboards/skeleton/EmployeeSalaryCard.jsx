import React from 'react';
import { Stack, Typography, Box, Skeleton } from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';

const SkeletonEmployeeSalaryCard = () => {
    return (
        (<DashboardCard>
            <>
                <Box sx={{
                    mt: 3
                }}>
                    <Skeleton variant="rounded" width={300} height={280} />
                </Box>

                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: "space-between",
                        mt: 7
                    }}>
                    <Stack direction="row" spacing={2} sx={{
                        alignItems: "center"
                    }}>
                        <Skeleton variant="rounded" width={38} height={38} />
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    fontWeight: "600"
                                }}>
                                <Skeleton variant="rounded" width={55} height={25} />
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary">
                                <Skeleton variant="rounded" width={55} height={25} />
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{
                        alignItems: "center"
                    }}>
                        <Skeleton variant="rounded" width={38} height={38} />
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    fontWeight: "600"
                                }}>
                                <Skeleton variant="rounded" width={55} height={25} />
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary">
                                <Skeleton variant="rounded" width={55} height={25} />
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </>
        </DashboardCard>)
    );
};

export default SkeletonEmployeeSalaryCard;
