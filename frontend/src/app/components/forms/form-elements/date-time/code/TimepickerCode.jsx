import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const TimepickerCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'
import dayjs from 'dayjs'

import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

 const [value2, setValue2] = React.useState(dayjs())
 <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimePicker
          value={value2}
          onChange={(newValue) => {
            setValue2(newValue)
          }}
          viewRenderers={{
            hours: renderTimeViewClock,
            minutes: renderTimeViewClock,
            seconds: renderTimeViewClock,
          }}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              sx: {
                '& .MuiSvgIcon-root': {
                  width: '18px',
                  height: '18px',
                },
                '& .MuiFormHelperText-root': {
                  display: 'none',
                },
              },
            },
          }}
        />
      </LocalizationProvider>
`}
      </CodeDialog>
    </>
  )
}

export default TimepickerCode
