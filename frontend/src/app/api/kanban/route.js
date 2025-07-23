import { NextResponse } from "next/server";
import { KanbanData } from "../../components/apps/kanban/kanbanData";

// Extracting unique task properties from TodoData
const taskPropertiesSet = new Set();

// Using forEach loops instead of flatMap
KanbanData.forEach((category) => {
  category.child.forEach((task) => {
    taskPropertiesSet.add(task.taskProperty);
  });
});

// Mock API endpoint to fetch TodoData
export async function GET() {
  try {
    return NextResponse.json({ status: 200, msg: "success", data: KanbanData });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}

// Mock API endpoint to clear all tasks from a category
export async function DELETE(req) {
  try {
    const { categoryId } = await req.json();
    const updatedTodoData = KanbanData.map((category) => {
      if (category.id === categoryId) {
        return { ...category, child: [] };
      }
      return category;
    });
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

// Mock API endpoint to add a new task
export async function POST(req) {
  try {
    const { categoryId, newTaskData } = await req.json();
    const updatedTodoData = KanbanData.map((category) => {
      if (category.id === categoryId) {
        return { ...category, child: [...category.child, newTaskData] };
      }
      return category;
    });
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

// Mock API endpoint to update the name of a category
export async function PUT(req) {
  try {
    const { categoryId, categoryName } = await req.json();
    const updatedTodoData = KanbanData.map((category) => {
      if (category.id === categoryId) {
        return { ...category, name: categoryName };
      }
      return category;
    });
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
