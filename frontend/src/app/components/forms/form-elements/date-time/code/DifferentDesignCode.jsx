import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const DifferentDesignCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import React from 'react';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';
import dayjs from 'dayjs'


 const [value, setValue] = React.useState(dayjs())
 <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
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
          value={value}
          onChange={(newValue) => {
            setValue(newValue)
          }}
        />
      </LocalizationProvider>
`}
      </CodeDialog>
    </>
  )
}

export default DifferentDesignCode
