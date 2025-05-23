import { createLlmClient } from './createLlmClient';

export function refreshLlmClient() {
  const llm = createLlmClient();
  return llm;
}
