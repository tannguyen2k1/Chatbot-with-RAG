// Mock API endpoint to add a new category

import { NextResponse } from "next/server";
import { KanbanData } from "../../../components/apps/kanban/kanbanData";

export async function POST(req) {
  try {
    const { categoryName } = await req.json();
    const newCategory = {
      id: Math.random(),
      name: categoryName,
      child: [],
    };
    KanbanData.push(newCategory);
    return NextResponse.json({
      status: 200,
      msg: "success",
      data: newCategory,
    });
  } catch (error) {
    return NextResponse.json({ status: 400, msg: "failed", error });
  }
}
