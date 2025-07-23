'use client'
import React from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'
import dayjs from 'dayjs'

const TimePickerDt = () => {
  const [value2, setValue2] = React.useState(dayjs())
  return (
    <>
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
    </>
  )
}

export default TimePickerDt
