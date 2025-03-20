export async function GET(req) {
    return new Response(
      JSON.stringify({ message: "Game API is running!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  