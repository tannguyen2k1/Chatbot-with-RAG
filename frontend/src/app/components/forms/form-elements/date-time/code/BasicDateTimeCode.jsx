import CodeDialog from '@/app/components/shared/CodeDialog'
import React from 'react'
const BasicDateTimeCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import React from 'react'
import dayjs from 'dayjs'
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

const [value3, setValue3] = React.useState(dayjs('2018-01-01T00:00:00.000Z'))

 <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileDateTimePicker
          onChange={(newValue) => {
            setValue3(newValue)
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: 'outlined',
              size: 'small',
              inputProps: { 'aria-label': 'basic date picker' },
            },
          }}
          value={value3}
        />
      </LocalizationProvider>
`}
      </CodeDialog>
    </>
  )
}

export default BasicDateTimeCode
