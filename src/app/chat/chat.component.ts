import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ChatMessage } from '../services/Gemini.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  errorMessage = '';

  private shouldScroll = false;

  constructor(private gemini: GeminiService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  async sendMessage(): Promise<void> {
    const trimmed = this.userInput.trim();
    if (!trimmed || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.messages.push({ role: 'user', text: trimmed });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    try {
      const reply = await this.gemini.sendMessage(this.messages);
      this.messages.push({ role: 'model', text: reply });
    } catch (err: any) {
      this.errorMessage = err?.message || 'Failed to get a response. Please try again.';
    } finally {
      this.isLoading = false;
      this.shouldScroll = true;
    }
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.errorMessage = '';
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // ignore if not yet rendered
    }
  }
}