import { NextResponse } from "next/server";
import { posts } from "../userData";


export async function POST(req) {
    try {
        const { postId, commentId, reply } = await req.json();
        const postIndex = posts.findIndex((x) => x.id === postId);
        const post = posts[postIndex];
        const cComments = post.data.comments || [];
        const commentIndex = cComments.findIndex((x) => x.id === commentId);
        const comment = cComments[commentIndex];
        if (comment && comment.data && comment.data.replies)
            comment.data.replies = [...comment.data.replies, reply];
        return NextResponse.json({ status: 200, msg: "Success", data: posts })
    } catch (error) {
        return NextResponse.json({ status: 200, msg: "Internal server error", error })
    }
}