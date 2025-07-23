import {
    Box,
    Typography,
    Avatar,
    Stack,
    ButtonGroup,
    Button,
} from "@mui/material";
import Link from "next/link";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ProductContext } from "@/app/context/Ecommercecontext";
import { useContext } from "react";
import emptyCart from "/public/images/products/empty-shopping-cart.svg";

import Image from "next/image";

const CartItems = () => {
    const {
        cartItems,
        incrementQuantity,
        decrementQuantity,
    } = useContext(ProductContext);

    return (
        (<Box sx={{
            px: 3
        }}>
            {cartItems.length > 0 ? (
                <>
                    {cartItems.map((product, index) => (
                        <Box key={product.id + index * index}>
                            <Stack direction="row" spacing={2} sx={{
                                py: 3
                            }}>
                                <Avatar
                                    src={product.photo}
                                    alt={product.photo}
                                    sx={{
                                        borderRadius: "10px",
                                        height: "75px",
                                        width: "95px",
                                    }}
                                />
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="textPrimary"
                                        sx={{
                                            fontWeight: 600
                                        }}
                                    >
                                        {product.title}
                                    </Typography>{" "}
                                    <Typography color="textSecondary" sx={{
                                        fontSize: "12px"
                                    }}>
                                        {" "}
                                        {product.category}
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={{
                                            alignItems: "center",
                                            mt: "5px"
                                        }}>
                                        <Typography variant="subtitle2" sx={{
                                            fontWeight: "500"
                                        }}>
                                            ${product.price * product.qty}
                                        </Typography>
                                        <ButtonGroup size="small" aria-label="small button group">
                                            <Button
                                                color="success"
                                                className="btn-xs"
                                                variant="text"
                                                onClick={() => decrementQuantity(product.id)}
                                                disabled={product.qty < 2}
                                            >
                                                <IconMinus stroke={1.5} size="0.8rem" />
                                            </Button>
                                            <Button
                                                color="inherit"
                                                sx={{ bgcolor: "transparent", color: "text.secondary" }}
                                                variant="text"
                                            >
                                                {product.qty}
                                            </Button>
                                            <Button
                                                color="success"
                                                className="btn-xs"
                                                variant="text"
                                                onClick={() => incrementQuantity(product.id)}
                                            >
                                                <IconPlus stroke={1.5} size="0.8rem" />
                                            </Button>
                                        </ButtonGroup>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    ))}
                </>
            ) : (
                <Box
                    sx={{
                        textAlign: "center",
                        mb: 3
                    }}>
                    <Image src="/images/products/empty-shopping-cart.svg" alt="cart" width={200} height={200} />
                    <Typography variant="h5" sx={{
                        mb: 2
                    }}>
                        Cart is Empty
                    </Typography>
                    <Button
                        component={Link}
                        href="/apps/ecommerce/shop"
                        variant="contained"
                    >
                        Go back to Shopping
                    </Button>
                </Box>
            )}
        </Box>)
    );
};

export default CartItems;
