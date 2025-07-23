import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const CustomOutlinedIcon = () => {
    return (
        <>
            <CodeDialog>
                {`
"use client";
import * as React from 'react';
import { 
Avatar, 
Chip, 
Grid

}  from '@mui/material';
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
    <Chip
        label="Custom Icon" color="primary" avatar={<Avatar >M</Avatar>}
        onDelete={handleDelete}
        deleteIcon={<IconCheck width={20} />}
    />
    <Chip
        label="Custom Icon" color="secondary" avatar={<Avatar >S</Avatar>}
        onDelete={handleDelete}
        deleteIcon={<IconChecks width={20} />}
    />
</InlineItemCard>
  </Grid>`}
            </CodeDialog>
        </>
    );
};

export default CustomOutlinedIcon;