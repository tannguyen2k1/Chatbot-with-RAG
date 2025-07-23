"use client"
import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import { Grid } from '@mui/material';
import SimpleLineChart from "@/app/components/muicharts/linescharts/linechart/SimpleLineChart";
import TinyLineChart from "@/app/components/muicharts/linescharts/linechart/TinyLineChart";
import DashedLineChart from "@/app/components/muicharts/linescharts/linechart/DashedLineChart";
import BiaxialLineChart from "@/app/components/muicharts/linescharts/linechart/BiaxialLineChart";
import LineChartWithReferenceLines from "@/app/components/muicharts/linescharts/linechart/LineChartWithReferenceLinesChart";
import LinewithforecastChart from "@/app/components/muicharts/linescharts/linechart/LinewithforecastChart";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Line Charts",
    },
];

const LineChart = () => {
    return (
        <PageContainer title=" Line Charts" description="this is  Line Charts">
            <Breadcrumb title=" Line  Charts" items={BCrumb} />
            <Grid container spacing={3}>

                <SimpleLineChart />


                <TinyLineChart />


                <DashedLineChart />


                <BiaxialLineChart />


                <LineChartWithReferenceLines />


                <LinewithforecastChart />


            </Grid>
        </PageContainer>
    );
};

export default LineChart;
