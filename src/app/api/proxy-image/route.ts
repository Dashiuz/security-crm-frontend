import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Parámetro 'url' requerido" }, { status: 400 });
  }

  // Security check: only allow http and https to authorized storage domains
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Protocolo no permitido" }, { status: 400 });
    }
    const isAllowedHost =
      parsed.hostname.endsWith("amazonaws.com") ||
      parsed.hostname.includes("s3") ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1";
    if (!isAllowedHost) {
      return NextResponse.json({ error: "Host no autorizado para proxy" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const s3Res = await fetch(targetUrl);
    if (!s3Res.ok) {
      return NextResponse.json(
        { error: `Error al obtener recurso remoto: ${s3Res.status} ${s3Res.statusText}` },
        { status: s3Res.status }
      );
    }

    const arrayBuffer = await s3Res.arrayBuffer();
    const contentType = s3Res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json(
      { dataUrl, contentType, size: arrayBuffer.byteLength },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error procesando proxy de imagen" },
      { status: 500 }
    );
  }
}
