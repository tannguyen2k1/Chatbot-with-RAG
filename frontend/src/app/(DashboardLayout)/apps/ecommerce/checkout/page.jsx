
import { Box } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import ProductCheckout from '@/app/components/apps/ecommerce/productCheckout/ProductCheckout';
import ChildCard from '@/app/components/shared/ChildCard';
import { ProductProvider } from '@/app/context/Ecommercecontext/index'

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Checkout',
  },
];

const EcommerceCheckout = () => {
  return (
    <ProductProvider>

      <PageContainer title="Checkout" description="this is Checkout">
        {/* breadcrumb */}
        <Breadcrumb title="Checkout" items={BCrumb} />
        <ChildCard>
          {/* ------------------------------------------- */}
          {/* Right part */}
          {/* ------------------------------------------- */}
          <Box p={3} flexGrow={1}>
            <ProductCheckout />
          </Box>
        </ChildCard>
      </PageContainer>
    </ProductProvider>

  );
};

export default EcommerceCheckout;
