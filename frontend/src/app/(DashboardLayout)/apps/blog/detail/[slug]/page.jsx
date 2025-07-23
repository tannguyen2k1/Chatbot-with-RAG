import BlogDetail from "@/app/components/apps/blog/detail";
import PageContainer from '@/app/components/container/PageContainer';
import { BlogProvider } from '@/app/context/BlogContext/index';
const BlogPost = () => {
  return (
    <BlogProvider>
      <PageContainer title="Blog Detail" description="this is Blog Detail">
        <BlogDetail />
      </PageContainer>
    </BlogProvider>
  );
};

export default BlogPost;
