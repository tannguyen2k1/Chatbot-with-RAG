import React from 'react';
import { Box, Switch } from '@mui/material';


const SizesSwitch = () => (
    <Box sx={{
        textAlign: "center"
    }}>
        <Switch defaultChecked size="small" />
        <Switch defaultChecked />
    </Box>
);
export default SizesSwitch;
