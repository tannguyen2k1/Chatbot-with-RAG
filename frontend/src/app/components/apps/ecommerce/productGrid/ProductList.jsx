"use client"
import React, { useContext, useEffect } from "react";
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'
import Fab from '@mui/material/Fab'
import { Grid } from '@mui/material'
import Rating from '@mui/material/Rating'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import Link from "next/link";
import { ProductContext } from "@/app/context/Ecommercecontext/index";


import ProductSearch from "./ProductSearch";
import { IconBasket, IconMenu2 } from "@tabler/icons-react";
import AlertCart from "../productCart/AlertCart";
import emptyCart from "/public/images/products/empty-shopping-cart.svg";
import BlankCard from "../../../shared/BlankCard";
import Image from "next/image";



const ProductList = ({ onClick }) => {
  const { filteredAndSortedProducts, addToCart, filterReset } =
    useContext(ProductContext);

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  // for alert when added something to cart
  const [cartalert, setCartalert] = React.useState(false);

  const handleClick = () => {

    setCartalert(true);
  };

  const handleClose = (reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setCartalert(false);
  };

  // skeleton
  const [isLoading, setLoading] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    (<Box>
      {/* ------------------------------------------- */}
      {/* Header Detail page */}
      {/* ------------------------------------------- */}
      <Stack direction="row" justifyContent="space-between" pb={3}>
        {lgUp ? (
          <Typography variant="h5">Products</Typography>
        ) : (
          <Fab onClick={onClick} color="primary" size="small">
            <IconMenu2 width="16" />
          </Fab>
        )}
        <Box>
          <ProductSearch />
        </Box>
      </Stack>
      {/* ------------------------------------------- */}
      {/* Page Listing product */}
      {/* ------------------------------------------- */}
      <Grid container spacing={3}>
        {filteredAndSortedProducts.length > 0 ? (
          <>
            {filteredAndSortedProducts.map((product) => (
              <Grid
                display="flex"
                alignItems="stretch"
                key={product.id}
                size={{
                  xs: 12,
                  lg: 4,
                  md: 4,
                  sm: 6
                }}>
                {/* ------------------------------------------- */}
                {/* Product Card */}
                {/* ------------------------------------------- */}
                {isLoading ? (
                  <>
                    <Skeleton
                      variant="rectangular"
                      width={270}
                      height={300}
                      sx={{
                        borderRadius: (theme) => theme.shape.borderRadius / 5,
                      }}
                    ></Skeleton>
                  </>
                ) : (
                  <BlankCard className="hoverCard">
                    <Typography
                      component={Link}
                      href={`/apps/ecommerce/detail/${product.id}`}
                    >
                      <Image src={product.photo} alt="img" width={250} height={268} style={{ width: "100%" }} />
                    </Typography>
                    <Tooltip title="Add To Cart">
                      <Fab
                        size="small"
                        color="primary"
                        onClick={() => {
                          addToCart(product.id);
                          handleClick();
                        }}
                        sx={{
                          bottom: "75px",
                          right: "15px",
                          position: "absolute",
                        }}
                      >
                        <IconBasket size="16" />
                      </Fab>
                    </Tooltip>
                    <CardContent sx={{ p: 3, pt: 2 }}>
                      <Typography variant="h6">{product.title}</Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        mt={1}
                      >
                        <Stack direction="row" alignItems="center">
                          <Typography variant="h6">${product.price}</Typography>
                          <Typography
                            color="textSecondary"
                            ml={1}
                            sx={{ textDecoration: "line-through" }}
                          >
                            ${product.salesPrice}
                          </Typography>
                        </Stack>
                        <Rating
                          name="read-only"
                          size="small"
                          value={product.rating}
                          readOnly
                        />
                      </Stack>
                    </CardContent>
                  </BlankCard>
                )}
                <AlertCart
                  handleClose={handleClose}
                  openCartAlert={cartalert}
                />
                {/* ------------------------------------------- */}
                {/* Product Card */}
                {/* ------------------------------------------- */}
              </Grid>
            ))}
          </>
        ) : (
          <>
            <Grid
              size={{
                xs: 12,
                lg: 12,
                md: 12,
                sm: 12
              }}>
              <Box textAlign="center" mt={6}>
                <Image src={emptyCart} alt="cart" width={200} />
                <Typography variant="h2">There is no Product</Typography>
                <Typography variant="h6" mb={3}>
                  The Product you are searching is no longer available.
                </Typography>
                <Button
                  variant="contained"
                  onClick={filterReset}
                >
                  Try Again
                </Button>
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </Box >)
  );
};

export default ProductList;
