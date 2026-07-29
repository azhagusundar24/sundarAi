import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment/environment';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
  }[];
  error?: {
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Free-tier model. Swap for 'gemini-2.5-flash-lite' or a newer model
  // name if you hit rate limits or Google renames the free-tier default.
  
  private readonly model = 'gemini-3.6-flash';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  private apiKeys = environment.geminiApiKeys;
  private currentKeyIndex = 0;

  constructor(private http: HttpClient) {}

  /**
   * Sends the full conversation history to Gemini and returns the
   * model's reply as plain text.
   */
  async sendMessage(history: ChatMessage[]): Promise<string> {

     console.log("API Keys:", this.apiKeys);
  console.log("Current Key:", this.apiKeys[this.currentKeyIndex]);

  const contents: GeminiContent[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const body = { contents };

  let lastError: any;

  // Try each API key until one succeeds
  for (let i = 0; i < this.apiKeys.length; i++) {

    const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
    const apiKey = this.apiKeys[keyIndex];

    const url =
      `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`;

    try {

      const response = await firstValueFrom(
        this.http.post<GeminiResponse>(url, body)
      );

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(response.error?.message || 'No response from Gemini.');
      }

      // Save the working key index
      this.currentKeyIndex = keyIndex;

      return text;

    } catch (err: any) {

      lastError = err;

      const status = err?.status;
      const message =
        err?.error?.error?.message || '';

      // Only switch keys for quota/rate limit errors
      if (
        status === 429 ||
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate')
      ) {

        console.warn(`API Key ${keyIndex + 1} exhausted. Trying next key...`);
        continue;
      }

      // Any other error should stop immediately
      throw new Error(message || 'Something went wrong.');
    }
  }

  throw new Error('All API keys are exhausted.');
  }};