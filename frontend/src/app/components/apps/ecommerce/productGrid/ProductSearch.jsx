// material
"use client"
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { IconSearch } from '@tabler/icons-react';
import { useContext } from 'react';
import { ProductContext } from "@/app/context/Ecommercecontext/index";


// ----------------------------------------------------------------------
export default function ProductSearch() {

  const { searchProducts } = useContext(ProductContext);
  return (<>
    {/* ------------------------------------------- */}
    {/* Sort Button */}
    {/* ------------------------------------------- */}
    <TextField
      id="outlined-search"
      placeholder="Search Product"
      size="small"
      type="search"
      variant="outlined"
      fullWidth
      onChange={(event) => searchProducts(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size="14" />
            </InputAdornment>
          ),
        }
      }}
    />
  </>);
}
