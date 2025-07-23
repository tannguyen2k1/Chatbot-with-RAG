import React from "react";
import { Stack, Box, Skeleton } from "@mui/material";
import DashboardCard from "../../shared/DashboardCard";

const SkeletonRevenueUpdatesCards = () => {
    return (
        (<DashboardCard>
            <>
                <Stack direction="row" spacing={3}>
                    <Stack direction="row" spacing={1} sx={{
                        alignItems: "center"
                    }}>
                        <Skeleton variant="circular" width={9} height={9} />
                        <Box sx={{
                            ml: 2
                        }}>
                            <Skeleton variant="rounded" width={112} height={21} />
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{
                        alignItems: "center"
                    }}>
                        <Skeleton variant="circular" width={9} height={9} />
                        <Box sx={{
                            ml: 2
                        }}>
                            <Skeleton variant="rounded" width={112} height={21} />
                        </Box>
                    </Stack>
                </Stack>
                <Box className="rounded-bars" sx={{
                    mt: 3
                }}>
                    <Skeleton variant="rounded" width={310} height={380} />
                </Box>
            </>
        </DashboardCard>)
    );
};

export default SkeletonRevenueUpdatesCards;
