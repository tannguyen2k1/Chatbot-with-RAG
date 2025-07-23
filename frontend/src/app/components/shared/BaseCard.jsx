'use client'
import React, { useContext } from 'react';
import { Card, CardHeader, CardContent, Divider } from '@mui/material';
import { CustomizerContext } from '@/app/context/customizerContext';


const BaseCard = ({ title, children }) => {
  const { isCardShadow } = useContext(CustomizerContext);

  return (
    <Card
      sx={{ padding: 0 }}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      <CardHeader title={title} />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default BaseCard;
