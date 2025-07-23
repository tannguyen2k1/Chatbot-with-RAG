'use client'
import { Card } from '@mui/material';
import { CustomizerContext } from '@/app/context/customizerContext';
import { useContext } from 'react';


const AppCard = ({ children }) => {
  const { isCardShadow } = useContext(CustomizerContext);


  return (
    <Card
      sx={{ display: 'flex', p: 0 }}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      {children}
    </Card>
  );
};

export default AppCard;
