import { NextResponse } from "next/server";
import { KanbanData } from "../../../components/apps/kanban/kanbanData";

export async function PATCH(req) {
  try {
    const { taskId, newData } = await req.json();
    KanbanData.forEach((category) => {
      category.child.forEach((task) => {
        if (task.id === taskId) {
          Object.assign(task, newData);
        }
      });
    });
    return NextResponse.json({ status: 200, msg: "success", data: KanbanData });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Internal server error",
      error,
    });
  }
}
