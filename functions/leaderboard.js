// functions/api/leaderboard.js

export async function onRequestGet(context) {
  try {
    // 1. Failsafe: Check if database is missing
    if (!context.env.LAFLAIR_SCORES) {
       return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    }

    const rawData = await context.env.LAFLAIR_SCORES.get("top_scores");
    
    // 2. Self-Healing: If data is corrupted, wipe it and return empty instead of crashing
    let scores = [];
    if (rawData) {
        try { 
            scores = JSON.parse(rawData); 
        } catch (e) { 
            scores = []; // Clears the poison data
        }
    }

    return new Response(JSON.stringify(scores), { 
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      } 
    });
  } catch (error) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}

export async function onRequestPost(context) {
  try {
    if (!context.env.LAFLAIR_SCORES) throw new Error("KV Binding Missing");

    const incomingData = await context.request.json();
    const existingData = await context.env.LAFLAIR_SCORES.get("top_scores");
    
    // Self-Healing
    let existingScores = [];
    if (existingData) {
        try { 
            existingScores = JSON.parse(existingData); 
        } catch (e) { 
            existingScores = []; 
        }
    }
    
    const incomingArray = Array.isArray(incomingData) ? incomingData : [incomingData];
    const combined = [...existingScores, ...incomingArray];
    
    // Remove duplicates and sort
    const uniqueScores = Array.from(new Set(combined.map(s => JSON.stringify(s))))
      .map(str => JSON.parse(str));
      
    uniqueScores.sort((a, b) => b.health - a.health);
    const top5 = uniqueScores.slice(0, 5);
    
    await context.env.LAFLAIR_SCORES.put("top_scores", JSON.stringify(top5));
    
    return new Response(JSON.stringify(top5), { 
        headers: { 
           "Content-Type": "application/json",
           "Cache-Control": "no-store" 
        } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}