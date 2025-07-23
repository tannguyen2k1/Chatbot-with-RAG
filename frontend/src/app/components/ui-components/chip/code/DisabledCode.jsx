import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const DisabledCode = () => {
    return (
        <>
            <CodeDialog>
                {`
"use client";
import * as React from 'react';
import { 
Avatar, 
Chip, 
Grid }  from '@mui/material';
import { 
IconCheck, 
IconChecks, 
IconMoodHappy } from '@tabler/icons-react';
import InlineItemCard from "@/app/components/shared/InlineItemCard";

         <Grid
                size={{
                    xs: 12,
                    sm: 6
                }}
                sx={{
                    display: "flex",
                    alignItems: "stretch"
<InlineItemCard>
    <Chip
        label="Custom Icon" disabled avatar={<Avatar >M</Avatar>}
        onDelete={handleDelete}
    />
    <Chip
        label="Custom Icon" color="primary" disabled avatar={<Avatar >S</Avatar>}
        onDelete={handleDelete}
    />
</InlineItemCard>
</Grid>`}
            </CodeDialog>
        </>
    );
};

export default DisabledCode;