import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import BlogListing from '@/app/components/apps/blog/BlogListing';
import { BlogProvider } from '@/app/context/BlogContext/index';
const Blog = () => {
  return (
    <BlogProvider>
      <PageContainer title="Blog" description="this is Blog">
        <Breadcrumb title="Blog app" subtitle="Get the latest news" />
        {/* ------------------------------------------- */}
        {/* Blog Listing */}
        {/* ------------------------------------------- */}
        <BlogListing />
      </PageContainer>
    </BlogProvider>
  );
};

export default Blog;
