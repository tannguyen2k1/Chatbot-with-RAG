'use client'
import { Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useContext } from 'react';
import { CustomizerContext } from '@/app/context/customizerContext';

import PropTypes from 'prop-types';

const BlankCard = ({ children, className, sx }) => {

  const { isCardShadow } = useContext(CustomizerContext);

  const theme = useTheme();
  const borderColor = theme.palette.divider;

  return (
    <Card
      sx={{ p: 0, border: !isCardShadow ? `1px solid ${borderColor}` : 'none', position: 'relative', sx }}
      className={className}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      {children}
    </Card>
  );
};

BlankCard.propTypes = {
  children: PropTypes.node,
};

export default BlankCard;
