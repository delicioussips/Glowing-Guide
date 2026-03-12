// netlify/functions/claude.js
const https = require("https");

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
  catch(e) { return { statusCode: 400, body: "Invalid JSON" }; }

  const beta = body._beta || null;
  delete body._beta;
  const payload = JSON.stringify(body);

  const reqHeaders = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "x-api-key": ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01"
  };
  if (beta) reqHeaders["anthropic-beta"] = beta;

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: reqHeaders
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
            body: data
          });
        });
      }
    );
    req.on("error", (err) => {
      resolve({
        statusCode: 502,
        body: JSON.stringify({ error: { message: err.message } })
      });
    });
    req.write(payload);
    req.end();
  });
};
