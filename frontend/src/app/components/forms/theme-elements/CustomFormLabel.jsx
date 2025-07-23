'use client';
import React from 'react';
import { styled }  from "@mui/system";
import { Typography } from '@mui/material';

const CustomFormLabel = styled((props) => (
  <Typography
    variant="subtitle1"
    {...props}
    component="label"
    htmlFor={props.htmlFor}
    sx={[{
      fontWeight: 600
    }, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]} />
))(() => ({
  marginBottom: '5px',
  marginTop: '25px',
  display: 'block',
}));

export default CustomFormLabel;
