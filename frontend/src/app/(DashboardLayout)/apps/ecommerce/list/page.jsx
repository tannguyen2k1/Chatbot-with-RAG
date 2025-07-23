"use client"
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import ProductTableList from '@/app/components/apps/ecommerce/ProductTableList/ProductTableList';
import BlankCard from '@/app/components/shared/BlankCard';
import { ProductProvider } from '@/app/context/Ecommercecontext/index'

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Shop',
  },
];

const EcomProductList = () => {
  return (
    <ProductProvider>
      <PageContainer title="eCommerce Product List" description="this is eCommerce Product List">
        {/* breadcrumb */}
        <Breadcrumb title="Ecom-Shop" items={BCrumb} />
        <BlankCard>
          {/* ------------------------------------------- */}
          {/* Left part */}
          {/* ------------------------------------------- */}
          <ProductTableList />
        </BlankCard>
      </PageContainer>
    </ProductProvider>
  );
};

export default EcomProductList;
