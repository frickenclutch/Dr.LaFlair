// functions/api/leaderboard.js

// Handles grabbing the scores (GET /api/leaderboard)
export async function onRequestGet(context) {
  try {
    // LAFLAIR_SCORES is the database name we will create in Cloudflare
    const scores = await context.env.LAFLAIR_SCORES.get("top_scores");
    return new Response(scores || "[]", {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response("[]", { status: 200 });
  }
}

// Handles saving new scores (POST /api/leaderboard)
export async function onRequestPost(context) {
  try {
    const newLeaderboard = await context.request.json();
    await context.env.LAFLAIR_SCORES.put("top_scores", JSON.stringify(newLeaderboard));
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to save" }), { status: 500 });
  }
}