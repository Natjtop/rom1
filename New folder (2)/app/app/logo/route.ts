import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const LOGO_FILENAME = "logonobg1.png";
const ONE_YEAR = "public, max-age=31536000, immutable";

function getLogoPath(): string | null {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "public", LOGO_FILENAME),
    path.join(cwd, ".next", "standalone", "public", LOGO_FILENAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function GET() {
  const logoPath = getLogoPath();
  if (!logoPath) {
    return new NextResponse("Logo not found", { status: 404 });
  }
  const body = fs.readFileSync(logoPath);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": ONE_YEAR,
      "Vary": "Accept-Encoding",
    },
  });
}
