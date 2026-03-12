// netlify/functions/claude.js
// Serverless proxy — keeps the Anthropic key on the server, never in the browser.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: "ANTHROPIC_KEY env var not set on server" } })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  // Forward any beta header the client requested
  const forwardHeaders = {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01"
  };
  if (body._beta) {
    forwardHeaders["anthropic-beta"] = body._beta;
    delete body._beta;
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    return {
      statusCode: resp.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
