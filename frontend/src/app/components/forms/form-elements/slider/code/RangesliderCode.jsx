import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const RangesliderCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import React from 'react';
import { styled } from '@mui/material/styles';
import { IconVolume, IconVolume2 } from '@tabler/icons-react';
import Typography from '@mui/material/Typography';
import { SliderValueLabelProps } from '@mui/material/Slider';
import { Box, SliderThumb } from '@mui/material';

const CustomSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-rail': {
    height: '9px',
    borderRadius: '9px',
    opacity: '1',
    backgroundColor: theme.palette.grey[200],
  },
  '& .MuiSlider-thumb': {
    borderRadius: '50%',
    backgroundColor: () => theme.palette.secondary.main,
    width: '23px',
    height: '23px',
  },
  '& .MuiSlider-track': {
    height: '9px',
    borderRadius: '9px',
  },
}));

function AirbnbThumbComponent(props) {
    const { children, ...other } = props;

    return (
        <SliderThumb {...other}>
            {children}
            <Box
                sx={{
                    height: 9,
                    width: '2px',
                    backgroundColor: '#fff',
                }}
            />
            <Box
                sx={{
                    height: '14px',
                    width: '2px',
                    backgroundColor: '#fff',
                    ml: '2px',
                }}
            />
            <Box
                sx={{
                    height: 9,
                    width: '2px',
                    backgroundColor: '#fff',
                    ml: '2px',
                }}
            />
        </SliderThumb>
    );
}

<CustomRangeSlider
    slots={{ thumb: AirbnbThumbComponent }}
    getAriaLabel={(index) => (index === 0 ? 'Minimum price' : 'Maximum price')}
    defaultValue={[20, 40]}
/>
`}
      </CodeDialog>
    </>
  )
}

export default RangesliderCode
