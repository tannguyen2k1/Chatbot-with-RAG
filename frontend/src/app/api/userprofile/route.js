import { NextResponse } from "next/server";
import { posts } from "./userData";




export async function GET(){
  try{
    return NextResponse.json({status:200, msg:"Success",data:posts})
  }catch(error){
    return NextResponse.json({status:200 , msg:"Internal server error", error})
  }
}

export async function POST(req){
  try{
    const { postId } = await req.json();
    const postIndex = posts.findIndex((x) => x.id === postId);
    const post = { ...posts[postIndex] };
    post.data = { ...post.data };
    post.data.likes = { ...post.data.likes };
    post.data.likes.like = !post.data.likes.like;
    post.data.likes.value = post.data.likes.like
      ? post.data.likes.value + 1
      : post.data.likes.value - 1;
    posts[postIndex] = post;

    return NextResponse.json({status:200, msg:"Success",data:posts})
  }catch(error){
    return NextResponse.json({status:200 , msg:"Internal server error", error})
  }
}

