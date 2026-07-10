export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\//, "").split("/")[0];

    if (!slug) {
      return new Response("Not found", { status: 404 });
    }

    const key = `handwerker/${slug}/index.html`;
    const obj = await env.R2.get(key);

    if (!obj) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(obj.body, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};
