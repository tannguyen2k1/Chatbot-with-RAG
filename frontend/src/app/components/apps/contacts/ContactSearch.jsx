import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { IconMenu2, IconSearch } from '@tabler/icons-react';
import { ContactContext } from '@/app/context/Conatactcontext';



const ContactSearch = ({ onClick }) => {
  const { updateSearchTerm, searchTerm } = useContext(ContactContext);
  const handleSearchChange = (e) => {
    updateSearchTerm(e.target.value);
  }

  return (
    <Box display="flex" sx={{ p: 2 }}>
      <Fab
        onClick={onClick}
        color="primary"
        size="small"
        sx={{ mr: 1, flexShrink: '0', display: { xs: 'block', lineHeight: '10px', lg: 'none' } }}
      >
        <IconMenu2 width="16" />
      </Fab>
      <TextField
        id="outlined-basic"
        fullWidth
        size="small"
        value={searchTerm}
        placeholder="Search Contacts"
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
    </Box>
  );
};

export default ContactSearch;
