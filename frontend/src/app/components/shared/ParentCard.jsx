'use client'
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Card, CardHeader, CardContent, Divider, Box } from '@mui/material';
import { CustomizerContext } from '@/app/context/customizerContext';


const ParentCard = ({ title, children, footer, codeModel }) => {
  const { isCardShadow } = useContext(CustomizerContext);


  const theme = useTheme();
  const borderColor = theme.palette.divider;

  return (
    (<Card
      sx={{ padding: 0, border: !isCardShadow ? `1px solid ${borderColor}` : 'none' }}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      <CardHeader title={title} action={codeModel} />
      <Divider />
      <CardContent>{children}</CardContent>
      {footer ? (
        <>
          <Divider />
          <Box sx={{
            p: 3
          }}>{footer}</Box>
        </>
      ) : (
        ''
      )}
    </Card>)
  );
};

ParentCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
};

export default ParentCard;
