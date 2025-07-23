import { NextResponse } from "next/server";
import { ProductsData } from "@/app/components/apps/ecommerce/productData";

// Api to fetch all products
export async function GET() {
  try {
    return NextResponse.json({
      status: 200,
      msg: "Success",
      data: ProductsData,
    });
  } catch (error) {
    return NextResponse.json({
      status: 400,
      msg: "Failed to fetch products",
      data: error,
    });
  }
}
