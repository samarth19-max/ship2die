import { NextRequest, NextResponse } from "next/server";
import { renderer } from "@/lib/engine/renderer";
import { packCopyTxt, packChecklistTxt } from "@/lib/engine/kit";
import { zipStore } from "@/lib/engine/zip";
import { Offer, DEFAULTS } from "@/lib/engine/types";

// Campaign pack — the PRO deliverable, built server-side so the ZIP works even
// without client-side zip support. og.png arrives as base64 from the builder's canvas.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offer: Offer = { ...DEFAULTS, ...body.offer };
    // sanitize like the renderer does
    if (offer.logo && !/^data:image\//.test(offer.logo)) offer.logo = "";
    if (offer.shot && !/^data:image\//.test(offer.shot)) offer.shot = "";
    const ogB64 = String(body.ogBase64 || "");
    const licensed = body.licensed === true || process.env.FORCE_PACK_OPEN === "1";

    if (!licensed) {
      return NextResponse.json({ ok: false, error: "Campaign pack is a PRO feature" }, { status: 402 });
    }
    const html = renderer(offer, { watermark: false });
    const copy = packCopyTxt(offer);
    const check = packChecklistTxt(offer);
    const ogBytes = ogB64 ? Buffer.from(ogB64.replace(/^data:image\/png;base64,/, ""), "base64") : new Uint8Array(0);
    const zip = zipStore([
      { name: "index.html", data: new TextEncoder().encode(html) },
      { name: "og.png", data: ogBytes instanceof Uint8Array ? ogBytes : new Uint8Array(ogBytes) },
      { name: "launch-copy.txt", data: new TextEncoder().encode(copy) },
      { name: "publish-checklist.txt", data: new TextEncoder().encode(check) },
    ]);
    const slug = (campaignName(offer)) || "campaign";
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-campaign-pack.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "pack build failed" }, { status: 500 });
  }
}

function campaignName(o: Offer): string {
  return (o.name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
