"use client"
import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import TinyBarChart from '@/app/components/muicharts/barcharts/TinyBarChart'
import StackedBarChart from '@/app/components/muicharts/barcharts/StackedBarChart'
import SimpleBarChart from "@/app/components/muicharts/barcharts/SimpleBarChart";
import MixedBarChart from '@/app/components/muicharts/barcharts/MixedBarChart'
import PositiveAndNegativeBarChart from "@/app/components/muicharts/barcharts/PositiveAndNegativeBarChart";
import BarChartStackedBySignChart from "@/app/components/muicharts/barcharts/BarChartStackedBySignChart";
import { Grid } from '@mui/material';
import BiaxialBarChart from "@/app/components/muicharts/barcharts/BiaxialBarChart";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Bar Charts",
    },
];

const BarChart = () => {
    return (
        <PageContainer title="Bar Charts" description="this is Bar Chart">

            <Breadcrumb title="Bar Charts" items={BCrumb} />
            <Grid container spacing={3}>
                <Grid
                    size={{
                        md: 6
                    }}
                >
                    <SimpleBarChart />
                </Grid>

                <Grid size={{
                    md: 6
                }} >
                    <MixedBarChart />
                </Grid>
                <Grid size={{

                    md: 6
                }}>
                    <PositiveAndNegativeBarChart />
                </Grid>
                <Grid size={{

                    md: 6
                }} >
                    <BarChartStackedBySignChart />
                </Grid>
                <Grid size={{
                    md: 6
                }}>
                    <BiaxialBarChart />
                </Grid>
                <Grid
                    size={{
                        md: 6
                    }}>
                    <StackedBarChart />

                </Grid>
                <Grid size={{
                    md: 6
                }}>
                    <TinyBarChart />
                </Grid>
            </Grid>
        </PageContainer>
    );
};

export default BarChart;

