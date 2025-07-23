import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const VolumesliderCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import React from 'react'
import { Slider, Stack } from '@mui/material'
import { IconVolume, IconVolume2 } from '@tabler/icons-react';

const [value, setValue] = React.useState(30);
const handleChange = (event, newValue) => {
        setValue(newValue);

<Stack direction="row" spacing={1}>
                <IconVolume2 width={20} />
                <Slider aria-label="Volume" value={value} onChange={handleChange} />
                <IconVolume width={20} />
            </Stack>
`}
      </CodeDialog>
    </>
  )
}

export default VolumesliderCode
