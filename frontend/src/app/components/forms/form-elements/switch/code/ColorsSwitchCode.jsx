import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const ColorsSwitchCode = () => {
  return (
    <>
      <CodeDialog>
        {`
import React from 'react';
import { Box, Switch } from '@mui/material';

<Box
    sx={{
      textAlign: 'center',
    }}>
    <Switch defaultChecked />
    <Switch defaultChecked color='secondary' />
    <Switch defaultChecked color='error' />
    <Switch defaultChecked color='warning' />
    <Switch defaultChecked color='success' />
    <Switch defaultChecked color='default' />
  </Box>
`}
      </CodeDialog>
    </>
  )
}

export default ColorsSwitchCode
