import { NextResponse } from "next/server";
import { KanbanData } from "../../../components/apps/kanban/kanbanData";

// Mock API endpoint to delete a category
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const updatedTodoData = KanbanData.filter((category) => category.id !== id);
    return NextResponse.json({
      status: 200,
      msg: "success",
      data: updatedTodoData,
    });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}
