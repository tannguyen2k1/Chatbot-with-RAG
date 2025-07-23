"use client"
import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ProductShop from "@/app/components/apps/ecommerce/productGrid";
import AppCard from "@/app/components/shared/AppCard";
import { ProductProvider } from '@/app/context/Ecommercecontext/index'


const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Shop",
  },
];
const Ecommerce = () => {
  return (
    <ProductProvider>
      <PageContainer title="Shop" description="this is Shop">
        {/* breadcrumb */}
        <Breadcrumb title="Shop" items={BCrumb} />
        <AppCard>
          <ProductShop />
        </AppCard>
      </PageContainer>
    </ProductProvider>
  );
};

export default Ecommerce;
