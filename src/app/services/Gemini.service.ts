import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
    code?: number;
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

  // Calls the Vercel Serverless Function
  private readonly apiUrl = '/api/chat';

  constructor(private http: HttpClient) {}

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

    const body = {
      contents
    };

    try {

      const response = await firstValueFrom(
        this.http.post<GeminiResponse>(this.apiUrl, body)
      );

      const text =
        response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(
          response.error?.message || 'No response from Gemini.'
        );
      }

      return text;

    } catch (err: any) {

      throw new Error(
        err?.error?.error?.message ||
        err?.error?.message ||
        err?.message ||
        'Something went wrong while contacting the AI.'
      );

    }
  }
}