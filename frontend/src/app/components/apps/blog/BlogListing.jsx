'use client'
import { useContext } from 'react';
import { Grid, Pagination } from '@mui/material';
import BlogCard from './BlogCard';
import { orderBy } from 'lodash';
import BlogFeaturedCard from './BlogFeaturedCard';
import { BlogContext } from "@/app/context/BlogContext/index";

const BlogListing = () => {
  const { posts, sortBy } = useContext(BlogContext);

  const filterBlogs = (posts, sortBy) => {
    // SORT BY

    if (sortBy === 'newest') {
      posts = orderBy(posts, ['createdAt'], ['desc']);
    }
    if (sortBy === 'oldest') {
      posts = orderBy(posts, ['createdAt'], ['asc']);
    }
    if (sortBy === 'popular') {
      posts = orderBy(posts, ['view'], ['desc']);
    }
    if (posts) {
      return (posts = posts.filter((t) => t.featured === false));
    }

    return posts;
  };

  const filterFeaturedpost = (posts) => {
    return (posts = posts.filter((t) => t.featured));
  };

  const blogPosts = filterBlogs(posts, sortBy);
  const featuredPosts = filterFeaturedpost(posts);

  return (
    (<Grid container spacing={3}>
      {featuredPosts.map((post, index) => {
        return <BlogFeaturedCard index={index} post={post} key={post.title} />;
      })}
      {blogPosts.map((post) => {
        return <BlogCard post={post} key={post.id} />;
      })}
      <Grid
        mt={3}
        size={{
          lg: 12,
          sm: 12
        }}>
        <Pagination count={10} color="primary" sx={{ display: 'flex', justifyContent: 'center' }} />
      </Grid>
    </Grid>)
  );
};

export default BlogListing;
