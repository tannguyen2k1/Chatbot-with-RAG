import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const TextSizesCode = () => {
  return (
    <>
      <CodeDialog>
        {`
import React from 'react';
import { Button, Stack } from '@mui/material';

<Stack
    spacing={1}
    direction="row"
    sx={{
      alignItems: "center",
      justifyContent: "center"
    }}>
    <Button size="small">Small</Button>
    <Button size="medium">Medium</Button>
    <Button size="large">Large</Button>
  </Stack>`}
      </CodeDialog>
    </>
  )
}

export default TextSizesCode
