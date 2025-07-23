'use client'
import React, { createContext, useState, useEffect } from 'react';

import { getFetcher } from '@/app/api/globalFetcher';
import useSWR from 'swr'



// Create context with default values
export const BlogContext = createContext({
    posts: [],
    sortBy: 'newest',
    selectedPost: null,
    isLoading: true,
    setPosts: () => { },
    setSortBy: () => { },
    setSelectedPost: () => { },
    setLoading: () => { },
    addComment: () => { },

    error: null
});

// BlogProvider component
export const BlogProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedPost, setSelectedPost] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Post data from the API
    const { data: postsData, isLoading: isPostsLoading, error: postsError } = useSWR('/api/blog', getFetcher);

    useEffect(() => {
        if (postsData) {
            setPosts(postsData.data);
            setLoading(isPostsLoading);
        }
        else if (postsError) {
            setError(postsError);
            setLoading(isPostsLoading);
        }
        else {
            setLoading(isPostsLoading);
        }
    }, [postsData, postsError, isPostsLoading]);

    // Adds a new comment to a specific post by updating the state.
    const addComment = (postId, newComment) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === postId ? { ...post, comments: [newComment, ...(post.comments || [])] } : post
            )
        );
    }



    const value = {
        posts,
        sortBy,
        selectedPost,
        isLoading,
        setPosts,
        setSortBy,
        setSelectedPost,
        setLoading,
        addComment,
        error
    };

    return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};