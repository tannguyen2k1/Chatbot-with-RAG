import React, { useContext } from 'react';
import { EmailContext } from "@/app/context/EmailContext";

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { IconMenu2, IconSearch } from '@tabler/icons-react';



const EmailSearch = ({ onClick }) => {
  const { setSearchQuery, searchQuery } = useContext(EmailContext);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
  };


  return (
    (<Box display="flex" sx={{ p: 2 }}>
      {/* ------------------------------------------- */}
      {/* Button toggle sidebar when lgdown */}
      {/* ------------------------------------------- */}
      <Fab
        onClick={onClick}
        color="primary"
        size="small"
        sx={{ mr: 1, flexShrink: '0', display: { xs: 'block', lineHeight: '10px', lg: 'none' } }}
      >
        <IconMenu2 width="16" />
      </Fab>
      {/* ------------------------------------------- */}
      {/* Search */}
      {/* ------------------------------------------- */}
      <TextField
        id="outlined-basic"
        fullWidth
        size="small"
        value={searchQuery}
        placeholder="Search emails"
        variant="outlined"
        onChange={handleSearchChange}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconSearch size={'16'} />
              </InputAdornment>
            ),
          }
        }}
      />
    </Box>)
  );
};

export default EmailSearch;
