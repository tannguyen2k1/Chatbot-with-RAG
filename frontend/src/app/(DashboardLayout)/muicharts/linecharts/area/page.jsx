"use client"
import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import { Grid } from '@mui/material';
import SimpleAreaChart from "@/app/components/muicharts/linescharts/areacharts/SimpleAreaChart";
import StackedAreaChart from "@/app/components/muicharts/linescharts/areacharts/StackedAreaChart";
import TinyAreaChart from "@/app/components/muicharts/linescharts/areacharts/TinyAreaChart";
import PercentAreaChart from "@/app/components/muicharts/linescharts/areacharts/PercentAreaChart";
import AreaChartConnectNulls from "@/app/components/muicharts/linescharts/areacharts/AreaChartConnectNullsChart";
import AreaChartFillByValueChart from "@/app/components/muicharts/linescharts/areacharts/AreaChartFillByValueChart";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: " Area Charts",
    },
];

const AreaCharts = () => {
    return (
        <PageContainer title=" Area Charts" description="this is  Area Chart">
            <Breadcrumb title=" Area  Charts" items={BCrumb} />
            <Grid container spacing={3}>

                <SimpleAreaChart />


                <StackedAreaChart />


                <TinyAreaChart />


                <PercentAreaChart />


                <AreaChartConnectNulls />


                <AreaChartFillByValueChart />



            </Grid>
        </PageContainer>
    );
};

export default AreaCharts;
