import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import { Grid } from '@mui/material';
import BasicCustomIcons from "@/app/components/muitrees/simpletree/BasicCustomIcons";
import CustomTreeItemView from "@/app/components/muitrees/simpletree/CustomTreeItemView";

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

                <BasicCustomIcons />
                <CustomTreeItemView />

            </Grid>
        </PageContainer>
    );
};

export default SimpleTreeView;
