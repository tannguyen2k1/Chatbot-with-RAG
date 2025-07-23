
"use client"
import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import { Grid } from '@mui/material';
import BasicGaugesChart from "@/app/components/muicharts/gaugecharts/BasicGaugesChart";
import ArcDesignChart from "@/app/components/muicharts/gaugecharts/ArcDesignChart";
import GaugePointerChart from "@/app/components/muicharts/gaugecharts/GaugePointerChart";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Gauge Charts ",
    },
];

const GaugeCharts = () => {
    return (
        <PageContainer title="Gauge Charts" description="this is Gauge Charts ">

            <Breadcrumb title="Gauge Charts" items={BCrumb} />
            <Grid container spacing={3}>
                <Grid
                    size={{
                        md: 6
                    }}
                >
                    <BasicGaugesChart />
                </Grid>
                <Grid
                    size={{
                        md: 6
                    }}
                >

                    <ArcDesignChart />
                </Grid>
                <Grid
                    size={{
                        md: 6
                    }}
                >

                    <GaugePointerChart />
                </Grid>


            </Grid>
        </PageContainer>
    );
};

export default GaugeCharts;
