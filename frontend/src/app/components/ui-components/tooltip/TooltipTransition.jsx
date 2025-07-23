'use client';
import { Button, Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';

// common component
import ChildCard from '@/app/components/shared/ChildCard';

// CodeModels
import TransitionsCode from '@/app/components/ui-components/tooltip/code/TransitionsCode';


const TooltipTransition = () => (

    <ChildCard title="Transitions" codeModel={<TransitionsCode />}>
        <Stack spacing={1} direction="row">
            <Tooltip title="Add">
                <Button variant="outlined" color="primary">
                    Grow
                </Button>
            </Tooltip>
            <Tooltip title="Add" slots={{
                transition: Fade
            }} slotProps={{
                transition: { timeout: 600 }
            }}>
                <Button variant="outlined" color="secondary">
                    Fade
                </Button>
            </Tooltip>
            <Tooltip title="Add" slots={{
                transition: Zoom
            }}>
                <Button variant="outlined" color="warning">
                    Zoom
                </Button>
            </Tooltip>
        </Stack>
    </ChildCard>
);
export default TooltipTransition;
