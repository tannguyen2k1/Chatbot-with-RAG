'use client'
import { Grid } from '@mui/material'
import { useContext } from 'react';
import PostItem from './PostItem';
import { PostTextBox } from './PostTextBox';
import { UserDataContext } from "@/app/context/UserDataContext/index";


const Post = () => {
  const { posts } = useContext(UserDataContext);
  return (
    (<Grid container spacing={3}>
      <Grid
        size={{
          sm: 12
        }}>
        <PostTextBox />
      </Grid>
      {posts.map((posts) => {
        return (
          (<Grid
            key={posts.id}
            size={{
              sm: 12
            }}>
            <PostItem post={posts} />
          </Grid>)
        );
      })}
    </Grid>)
  );
// UNUSED: This component is no longer used and can be deleted.
};

export default Post;
