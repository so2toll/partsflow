import type { APIRoute } from "astro";

export const post: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    console.log("Received message:", data);
    
    return new Response(JSON.stringify({ message: "Data received successfully!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Failed to receive message:", error);
    return new Response(JSON.stringify({ error: "Failed to process message" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
