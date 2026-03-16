import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    associatedApplications: [
      {
        applicationId: "1d6af8e7-8fb0-4ec5-adbb-a3f0585ed152",
      },
    ],
  })
}
