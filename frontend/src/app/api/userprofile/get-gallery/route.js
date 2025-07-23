

import { NextResponse } from "next/server";
import { gallery } from "../userData";



export async function GET(){
    try{ 
      return NextResponse.json({status:200, msg:"Success",data:gallery})
    }catch(error){
        return NextResponse.json({status:200 , msg:"Internal server error", error})
    }
}
