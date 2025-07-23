'use client'
import React from 'react'
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

const DiffrentDesignDt = () => {
  const [value, setValue] = React.useState(dayjs())
  return (
    <>
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
    </>
  )
}

export default DiffrentDesignDt
