import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const SimpleTooltipCode = () => {
    return (
        <>
            <CodeDialog>
                {`
"use client";
import * as React from 'react';
import { IconButton, Button, Stack, Fab } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

import { IconPlus, IconTrash } from '@tabler/icons-react';

<Stack direction="row" spacing={2} sx={{
            alignItems: "center"
        }}>
    <Tooltip title="Delete">
        <IconButton>
            <IconTrash width={20} height={20} />
        </IconButton>
    </Tooltip>
    <Tooltip title="Add">
        <Button variant="outlined" color="primary">
            Button
        </Button>
    </Tooltip>
    <Tooltip title="Delete">
        <IconButton color="error">
            <IconTrash width={20} height={20} />
        </IconButton>
    </Tooltip>
    <Tooltip title="Add">
        <Fab color="secondary">
            <IconPlus width={20} height={20} />
        </Fab>
    </Tooltip>
</Stack>`}
            </CodeDialog>
        </>
    );
};

export default SimpleTooltipCode;
