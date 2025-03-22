import { Attachment } from 'ai';
import { encode } from 'gpt-tokenizer';

const MAX_TOKENS = 4000;

export function countTokens(text: string): number {
  return encode(text).length;
}

export function batchInput(input: string, attachments: Array<Attachment>) {
  const words = input.split(/\s+/);
  const batches = [];
  let currentBatch = '';

  for (const word of words) {
    if (countTokens(currentBatch + ' ' + word) > MAX_TOKENS) {
      batches.push({ role: 'user', content: currentBatch.trim() });
      currentBatch = word;
    } else {
      currentBatch += ' ' + word;
    }
  }

  if (currentBatch.trim().length > 0) {
    batches.push({ role: 'user', content: currentBatch.trim() });
  }

  if (attachments.length > 0) {
    batches.push({ role: 'user', content: attachments.map((attachment) => attachment.url).join('\n') });
  }

  return batches;
}

export async function sendBatchedMessages(messages: Array<{ role: string; content: string }>) {
  const batchedMessages = batchInput(messages.map(msg => msg.content).join(' '), []);
  let combinedResponse = '';
  
  for (const message of batchedMessages) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: message }]}),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const result = await response.json();
    combinedResponse += result.response + '\n';
  }
  
  return combinedResponse;
}