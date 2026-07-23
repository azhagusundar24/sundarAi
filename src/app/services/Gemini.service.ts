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

  constructor(private http: HttpClient) {}

  /**
   * Sends the full conversation history to Gemini and returns the
   * model's reply as plain text.
   */
  async sendMessage(history: ChatMessage[]): Promise<string> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${environment.geminiApiKey}`;

    const contents: GeminiContent[] = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const body = { contents };

    try {
      const response = await firstValueFrom(
        this.http.post<GeminiResponse>(url, body)
      );

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(response.error?.message || 'No response from Gemini.');
      }

      return text;
    } catch (err: any) {
      const message =
        err?.error?.error?.message ||
        err?.message ||
        'Something went wrong while contacting Gemini.';
      throw new Error(message);
    }
  }
}