"use client"
import React, { useContext, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  CardContent,
  Grid,
  Rating,
  Skeleton,
} from "@mui/material";

import Link from "next/link";
import BlankCard from "../../../shared/BlankCard";

import Image from "next/image";
import { ProductContext } from "@/app/context/Ecommercecontext/index";

const ProductRelated = () => {

  const { products } = useContext(ProductContext)


  const relatedProducts = products.filter((product) => product.related);


  // skeleton
  const [isLoading, setLoading] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    (<Box>
      <Typography variant="h4" mb={2} mt={5}>
        Related Products
      </Typography>
      <Grid container spacing={3}>
        {relatedProducts.map((product) => (
          <Grid
            display="flex"
            alignItems="stretch"
            key={product.title}
            size={{
              xs: 12,
              lg: 3,
              sm: 4
            }}>
            {/* ------------------------------------------- */}
            {/* Product Card */}
            {/* ------------------------------------------- */}
            <BlankCard sx={{ p: 0 }} className="hoverCard">
              <Typography
                component={Link}
                href={`/apps/ecommerce/detail/${product.id}`}
              >
                {isLoading ? (
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height={270}
                  ></Skeleton>
                ) : (
                  <Image src={product.photo} alt="img" width={250} height={268} style={{ width: "100%" }} />
                )}
              </Typography>
              <CardContent sx={{ p: 3, pt: 2 }}>
                <Typography fontWeight={600}>{product.title}</Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mt={1}
                >
                  <Stack direction="row" alignItems="center">
                    <Typography variant="h5">${product.price}</Typography>
                    <Typography
                      color={"GrayText"}
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
          </Grid>
        ))}
      </Grid>
    </Box>)
  );
};

export default ProductRelated;
