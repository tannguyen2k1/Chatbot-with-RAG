import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const SizesSwitchCode = () => {
  return (
    <>
      <CodeDialog>
        {`
import React from 'react';
import { Box, Switch } from '@mui/material';

<Box sx={{
        textAlign: "center"
    }}>
        <Switch defaultChecked size="small" />
        <Switch defaultChecked />
    </Box>
`}
      </CodeDialog>
    </>
  )
}

export default SizesSwitchCode
