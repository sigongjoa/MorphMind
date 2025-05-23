import { CodeItem } from './CodeItem';

export interface CodeSession {
  id: string;
  name: string;
  items: CodeItem[];
  createdAt: string;
  updatedAt: string;
}
