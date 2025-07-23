"use client"
import React, { useContext, useEffect, useRef } from "react";
import { Box, Avatar } from "@mui/material";

import { useParams } from "next/navigation";

//Carousel slider for product
import Slider from "react-slick";

//Carousel slider data
import SliderData from "./SliderData";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css";


import Image from "next/image";
import { ProductContext } from "@/app/context/Ecommercecontext/index";


const ProductCarousel = () => {
  const [state, setState] = React.useState({ nav1: null, nav2: null });
  const slider1 = useRef();
  const slider2 = useRef();
  const { products } = useContext(ProductContext);


  const { id } = useParams();

  const product = products.find((p) => p.id === Number(id));
  const getProductImage = product ? product.photo : "/images/products/s1.jpg";


  useEffect(() => {
    setState({
      nav1: slider1.current,
      nav2: slider2.current,
    });
  }, []);

  const { nav1, nav2 } = state;
  const settings = {
    focusOnSelect: true,
    infinite: true,
    slidesToShow: 5,
    arrows: false,
    swipeToSlide: true,
    slidesToScroll: 1,
    centerMode: true,
    className: "centerThumb",
    speed: 500,
  };

  return (
    <Box>
      <Slider asNavFor={nav2} ref={(slider) => (slider1.current = slider)}>
        <Box>
          <Image
            src={getProductImage}
            alt={getProductImage}
            width={500}
            height={500}
            style={{ borderRadius: '5px', width: '100%', height: 'auto' }}
          />
        </Box>
        {SliderData.map((step) => (
          <Box key={step.id}>
            <Image
              src={step.imgPath} width={500} height={500}
              alt={step.imgPath}
              style={{ borderRadius: '5px', width: '100%', height: 'auto' }}
            />
          </Box>
        ))}
      </Slider>
      <Slider
        asNavFor={nav1}
        ref={(slider) => (slider2.current = slider)}
        {...settings}
      >
        <Box sx={{ p: 1, cursor: "pointer" }}>
          <Image
            src={getProductImage}
            alt={getProductImage} width={72} height={72}
            style={{ borderRadius: '5px' }}
          />
        </Box>
        {SliderData.map((step) => (
          <Box key={step.id} sx={{ p: 1, cursor: "pointer" }}>
            <Image
              src={step.imgPath}
              alt={step.imgPath} width={72} height={72}
              style={{ borderRadius: '5px' }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default ProductCarousel;
