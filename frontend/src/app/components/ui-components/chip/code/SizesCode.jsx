import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const SizesCode = () => {
    return (
        <>
            <CodeDialog>
                {`
"use client";
import * as React from 'react';
import { 
Chip, 
Grid }  from '@mui/material';
import InlineItemCard from "@/app/components/shared/InlineItemCard";

     <Grid
                size={{
                    xs: 12,
                    sm: 6
                }}
                sx={{
                    display: "flex",
                    alignItems: "stretch"
                }}>
<InlineItemCard>
    <Chip label="Small" size="small" color="primary" />
    <Chip label="Normal" color="primary" />
</InlineItemCard>
 </Grid>`}
            </CodeDialog>
        </>
    );
};

export default SizesCode;