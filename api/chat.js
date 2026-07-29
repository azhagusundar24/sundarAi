const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2
];

const MODEL = "gemini-3.6-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  const body = req.body;

  let lastError = null;

  for (const key of API_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json(data);
      }

      const message = data?.error?.message || "";

      if (
        response.status === 429 ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("rate")
      ) {
        continue;
      }

      lastError = data;
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(500).json(lastError);
}