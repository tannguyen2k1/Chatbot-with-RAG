import React from "react";
import { Box, Skeleton, Typography } from "@mui/material";

import DashboardCard from "../../shared/DashboardCard";

const SkeletonSalesCard = () => {

    return (
        (<DashboardCard>
            <>
                <Typography variant="h4" sx={{
                    mb: 1
                }}><Skeleton variant="rounded" width={112} height={25} /></Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{
                    mb: 3
                }}>
                    <Skeleton variant="rounded" width={112} height={21} />
                </Typography>
                <Box className="rounded-bars">
                    <Skeleton variant="rounded" width={112} height={80  } />
                </Box>
            </>
        </DashboardCard>)
    );
};

export default SkeletonSalesCard;
