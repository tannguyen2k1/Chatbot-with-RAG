import React from "react";
import { Stack, Typography, Avatar, Skeleton } from "@mui/material";
import { IconArrowUpLeft } from "@tabler/icons-react";

import DashboardCard from "../../shared/DashboardCard";


const SkeletonMonthlyEarningsCard = () => {

    return (
        (<DashboardCard>
            <>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        alignItems: "center",
                        mb: 3
                    }}>
                    <Typography variant="h3" sx={{
                        fontWeight: "700"
                    }}>
                        <Skeleton variant="rounded" width={90} height={21} />
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            ml: 1,
                            mt: 1,
                            mb: 2,
                            alignItems: "center"
                        }}>
                        <Skeleton variant="rounded" width={90} height={21} />
                    </Stack>
                </Stack>

                <Skeleton variant="rounded" width={300} height={140} />
            </>
        </DashboardCard>)
    );
};

export default SkeletonMonthlyEarningsCard;
