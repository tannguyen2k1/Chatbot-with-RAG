import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const TextSecondaryCode = () => {
    return (
        <>
            <CodeDialog>
                {`
import { Typography } from '@mui/material';

<Typography variant="body1" color="textSecondary">
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
</Typography>`}
            </CodeDialog>
        </>
    );
};

export default TextSecondaryCode;