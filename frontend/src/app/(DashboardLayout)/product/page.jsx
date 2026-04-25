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
    title: 'Sản phẩm',
  },
];

const ProductPage = () => {
  return (
    <ProductProvider>
      <PageContainer title="Quản lý Sản phẩm" description="Trang quản lý sản phẩm sử dụng Dashboard Layout">
        <Breadcrumb title="Sản phẩm" items={BCrumb} />
        <BlankCard>
          <ProductTableList />
        </BlankCard>
      </PageContainer>
    </ProductProvider>
  );
};

export default ProductPage;
