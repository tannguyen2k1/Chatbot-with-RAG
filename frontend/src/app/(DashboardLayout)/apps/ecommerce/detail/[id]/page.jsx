

import { Grid } from '@mui/material';
import ProductCarousel from '@/app/components/apps/ecommerce/productDetail/ProductCarousel';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import ProductDetail from '@/app/components/apps/ecommerce/productDetail';
import ProductDesc from '@/app/components/apps/ecommerce/productDetail/ProductDesc';
import ProductRelated from '@/app/components/apps/ecommerce/productDetail/ProductRelated';
import ChildCard from '@/app/components/shared/ChildCard';
import { ProductProvider } from '@/app/context/Ecommercecontext/index'

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Shop',
    to: '/apps/ecommerce/shop',
  },
  {
    title: 'detail',
  },
];

const EcommerceDetail = () => {
  return (
    <ProductProvider>
      <PageContainer title="eCommerce Detail" description="this is eCommerce Detail">
        {/* breadcrumb */}
        <Breadcrumb title="Product Detail" items={BCrumb} />
        <Grid container spacing={3} sx={{ maxWidth: { lg: '1055px', xl: '1200px' } }}>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              lg: 12
            }}>
            <ChildCard>
              {/* ------------------------------------------- */}
              {/* Carousel */}
              {/* ------------------------------------------- */}
              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 12,
                    lg: 6
                  }}>
                  <ProductCarousel />
                </Grid>
                <Grid
                  size={{
                    xs: 12,
                    sm: 12,
                    lg: 6
                  }}>
                  <ProductDetail />
                </Grid>
              </Grid>
            </ChildCard>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              lg: 12
            }}>
            <ProductDesc />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              lg: 12
            }}>
            <ProductRelated />
          </Grid>
        </Grid>
      </PageContainer>
    </ProductProvider>
  );
};

export default EcommerceDetail;
