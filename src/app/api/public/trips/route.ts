import { NextResponse } from "next/server";
import { listPublishedPackages, publicPackageDto } from "@/lib/site/catalog";

export async function GET() {
  const packages = await listPublishedPackages();
  return NextResponse.json({
    trips: packages.map(publicPackageDto),
  });
}
