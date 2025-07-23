

import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";

import { Grid } from '@mui/material';
import BasicSimpleTreeView from "@/app/components/muitrees/simpletree/BasicSimpleTreeView";
import TrackitemclicksTree from "@/app/components/muitrees/simpletree/TrackitemclicksTree";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Simple Treeview ",
    },
];

const SimpleTreeView = () => {
    return (
        <PageContainer title="Simple Treeview" description="this is Simple Treeview ">
            <Breadcrumb title="Simple Treeview" items={BCrumb} />
            <Grid container spacing={3}>

                <BasicSimpleTreeView />

                <TrackitemclicksTree />

            </Grid>
        </PageContainer>
    );
};

export default SimpleTreeView;
