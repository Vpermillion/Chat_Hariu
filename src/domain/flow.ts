import type { FlowNode, Language, Message, Workspace } from './models';
import { normalize, simulate, uid } from './services';
export interface FlowPreviewState {
  current: string;
  messages: Message[];
  waiting: boolean;
  ended: boolean;
  steps: number;
  input: string;
}
export function runFlow(
  workspace: Workspace,
  nodes: FlowNode[],
  language: Language,
  previous?: FlowPreviewState,
  input = '',
): FlowPreviewState {
  const state: FlowPreviewState = previous
    ? structuredClone(previous)
    : {
        current: nodes.find((n) => n.type === 'start')?.id || '',
        messages: [],
        waiting: false,
        ended: false,
        steps: 0,
        input: '',
      };
  const push = (text: string, role: Message['role'] = 'bot', productId?: string) =>
    state.messages.push({
      id: uid(),
      role,
      text,
      at: new Date().toISOString(),
      ...(productId ? { productId } : {}),
    });
  if (previous?.waiting) {
    if (!input.trim()) return state;
    push(input, 'customer');
    state.input = input;
    state.waiting = false;
    state.current = nodes.find((n) => n.id === state.current)?.next || '';
  }
  while (state.current && !state.ended && !state.waiting && state.steps < 40) {
    state.steps++;
    const node = nodes.find((n) => n.id === state.current);
    if (!node) {
      state.ended = true;
      break;
    }
    if (node.type === 'message' || node.type === 'question') push(node.text);
    if (node.type === 'question') {
      state.waiting = true;
      break;
    }
    if (node.type === 'ai') {
      const answer = simulate(workspace, state.input, language);
      push(answer.text, 'bot', answer.productId);
      if (answer.handoff) state.ended = true;
    }
    if (node.type === 'handoff') {
      push(
        language === 'mn'
          ? 'Яриаг ажилтанд шилжүүлэх демо хүсэлт үүслээ.'
          : 'A demo human handoff was requested.',
      );
      state.ended = true;
    }
    state.current =
      node.type === 'condition'
        ? normalize(state.input).includes(normalize(node.condition))
          ? node.next
          : node.alternate
        : node.next;
  }
  if (!state.current || state.steps >= 40) state.ended = true;
  return state;
}
