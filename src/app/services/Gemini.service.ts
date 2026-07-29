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
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  // Calls the Vercel Serverless Function
  private readonly apiUrl = '/api/chat';

  constructor(private http: HttpClient) {}

  async sendMessage(history: ChatMessage[]): Promise<string> {

    const contents: GeminiContent[] = history.map(message => ({
      role: message.role,
      parts: [
        {
          text: message.text
        }
      ]
    }));

    const body = {
      contents
    };

    try {

      const response = await firstValueFrom(
        this.http.post<GeminiResponse>(this.apiUrl, body)
      );

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

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