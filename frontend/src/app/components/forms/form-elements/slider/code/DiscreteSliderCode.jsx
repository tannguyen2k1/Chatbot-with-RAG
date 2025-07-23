import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const DiscreteSliderCode = () => {
  return (
    <>
      <CodeDialog>
        {`
"use client";
import * as React from 'react';
import { Slider } from '@mui/material';

 const valuetext = (value) => \`\${value}°C\`;

  <Slider
                aria-label="Temperature"
                defaultValue={30}
                getAriaValueText={valuetext}
                valueLabelDisplay="auto"
                step={10}
                marks
                min={10}
                max={110}
            />
        </>
`}
      </CodeDialog>
    </>
  );
};

export default DiscreteSliderCode;