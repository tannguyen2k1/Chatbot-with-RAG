import { NextResponse } from "next/server";
import { posts } from "../userData";


export async function POST(req){
    try{
        const { postId, comment } = await req.json();
        const postIndex = posts.findIndex((x) => x.id === postId);
        const post = posts[postIndex];
        const cComments = post.data.comments || [];
        post.data.comments = [...cComments, comment];
        return NextResponse.json({status:200, msg:"Success",data:posts})
    }catch(error){
        return NextResponse.json({status:200 , msg:"Internal server error", error})
    }
}