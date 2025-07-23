'use client'
import React from 'react'
import dayjs from 'dayjs'
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker'

import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

const BasicDateTime = () => {
  const [value3, setValue3] = React.useState(dayjs('2018-01-01T00:00:00.000Z'))
  return (
    <>
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
    </>
  )
}

export default BasicDateTime
