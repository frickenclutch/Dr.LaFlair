// functions/api/leaderboard.js

// Handles grabbing the scores (GET /api/leaderboard)
export async function onRequestGet(context) {
  try {
    const scores = await context.env.LAFLAIR_SCORES.get("top_scores");
    return new Response(scores || "[]", { 
      headers: { 
        "Content-Type": "application/json",
        // Tells browsers and Cloudflare edge nodes NEVER to cache this response
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      } 
    });
  } catch (error) {
    return new Response("[]", { status: 200 });
  }
}

// Handles saving new scores (POST /api/leaderboard)
export async function onRequestPost(context) {
  try {
    // 1. Get the new score sent by the device
    const incomingData = await context.request.json();
    
    // 2. Get the current OFFICIAL scores from the cloud
    const existingData = await context.env.LAFLAIR_SCORES.get("top_scores");
    const existingScores = existingData ? JSON.parse(existingData) : [];
    
    // Ensure incoming is treated as an array (handles both single objects and arrays)
    const incomingArray = Array.isArray(incomingData) ? incomingData : [incomingData];
    
    // 3. Mash them all together
    const combined = [...existingScores, ...incomingArray];
    
    // 4. Remove exact duplicates (in case of double submissions)
    const uniqueScores = Array.from(new Set(combined.map(s => JSON.stringify(s))))
      .map(str => JSON.parse(str));
      
    // 5. Sort highest health to lowest, keep Top 5
    uniqueScores.sort((a, b) => b.health - a.health);
    const top5 = uniqueScores.slice(0, 5);
    
    // 6. Save the true, merged Top 5 back to the cloud
    await context.env.LAFLAIR_SCORES.put("top_scores", JSON.stringify(top5));
    
    // 7. RETURN the official top 5 back to the frontend so it updates instantly!
    return new Response(JSON.stringify(top5), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to save" }), { status: 500 });
  }
}