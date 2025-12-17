export const RASA_API_URL = "http://127.0.0.1:5005/webhooks/rest/webhook";

// Send message to Rasa and get the response
export async function sendMessageToRasa(message: string, language?: string, sessionId?: string) {
  try {
    const response = await fetch(RASA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "user", message, language, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Rasa API returned status ${response.status}`);
    }

    const data = await response.json();
    // data is an array of Rasa messages, e.g. [{recipient_id, text}]
    return data;
  } catch (error) {
    console.error("Error sending message to Rasa:", error);
    return [{ text: "Sorry, the chatbot is unavailable right now." }];
  }
}