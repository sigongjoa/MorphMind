import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 코드 히스토리 및 세션 관리를 위한 클래스
export class HistoryManager {
  private readonly storageUri: vscode.Uri;
  private sessions: Map<string, CodeSession> = new Map();
  private activeSessionId: string = '';
  private bookmarks: CodeItem[] = [];

  constructor(storageUri: vscode.Uri) {
    this.storageUri = storageUri;
    this.loadSessions();
  }

  // 모든 세션 불러오기
  private async loadSessions() {
    try {
      const sessionsDir = vscode.Uri.joinPath(this.storageUri, 'sessions');
      await this.ensureDirectory(sessionsDir);

      const entries = await vscode.workspace.fs.readDirectory(sessionsDir);
      for (const [name, type] of entries) {
        if (type === vscode.FileType.File && name.endsWith('.json')) {
          const sessionId = name.replace('.json', '');
          const sessionUri = vscode.Uri.joinPath(sessionsDir, name);
          const sessionData = await vscode.workspace.fs.readFile(sessionUri);
          const session = JSON.parse(Buffer.from(sessionData).toString()) as CodeSession;
          this.sessions.set(sessionId, session);
        }
      }

      // 북마크 불러오기
      const bookmarksUri = vscode.Uri.joinPath(this.storageUri, 'bookmarks.json');
      try {
        const bookmarkData = await vscode.workspace.fs.readFile(bookmarksUri);
        this.bookmarks = JSON.parse(Buffer.from(bookmarkData).toString()) as CodeItem[];
      } catch (e) {
        // 북마크 파일이 없으면 빈 배열로 초기화
        this.bookmarks = [];
      }

      console.log(`세션 ${this.sessions.size}개, 북마크 ${this.bookmarks.length}개 로드 완료`);
    } catch (error) {
      console.error('세션 로드 중 오류 발생:', error);
    }
  }

  // 디렉토리 존재 확인 및 생성
  private async ensureDirectory(uri: vscode.Uri): Promise<void> {
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.createDirectory(uri);
    }
  }

  // 새 세션 생성
  createSession(name: string = ''): string {
    const timestamp = new Date().toISOString();
    const sessionId = `session_${timestamp.replace(/[:.]/g, '-')}`;
    const sessionName = name || `세션 ${new Date().toLocaleDateString()}`;
    
    const newSession: CodeSession = {
      id: sessionId,
      name: sessionName,
      items: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.sessions.set(sessionId, newSession);
    this.activeSessionId = sessionId;
    this.saveSession(sessionId);
    
    return sessionId;
  }

  // 세션 저장
  private async saveSession(sessionId: string) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;
      
      const sessionsDir = vscode.Uri.joinPath(this.storageUri, 'sessions');
      await this.ensureDirectory(sessionsDir);
      
      const sessionUri = vscode.Uri.joinPath(sessionsDir, `${sessionId}.json`);
      const content = JSON.stringify(session, null, 2);
      
      await vscode.workspace.fs.writeFile(
        sessionUri,
        Buffer.from(content, 'utf-8')
      );
    } catch (error) {
      console.error('세션 저장 중 오류 발생:', error);
    }
  }

  // 코드 아이템 추가
  async addCodeItem(code: string, result: string, error: boolean = false) {
    if (!this.activeSessionId) {
      this.createSession();
    }
    
    const session = this.sessions.get(this.activeSessionId);
    if (!session) return null;
    
    const timestamp = new Date().toISOString();
    const item: CodeItem = {
      id: `item_${timestamp.replace(/[:.]/g, '-')}`,
      code,
      result,
      hasError: error,
      timestamp
    };
    
    session.items.push(item);
    session.updatedAt = timestamp;
    await this.saveSession(this.activeSessionId);
    
    return item;
  }

  // 북마크 추가
  async addBookmark(item: CodeItem) {
    // 이미 북마크에 있는지 확인
    const exists = this.bookmarks.some(b => b.id === item.id);
    if (!exists) {
      this.bookmarks.push(item);
      await this.saveBookmarks();
    }
  }

  // 북마크 제거
  async removeBookmark(itemId: string) {
    const index = this.bookmarks.findIndex(b => b.id === itemId);
    if (index !== -1) {
      this.bookmarks.splice(index, 1);
      await this.saveBookmarks();
    }
  }

  // 북마크 저장
  private async saveBookmarks() {
    try {
      const bookmarksUri = vscode.Uri.joinPath(this.storageUri, 'bookmarks.json');
      const content = JSON.stringify(this.bookmarks, null, 2);
      
      await vscode.workspace.fs.writeFile(
        bookmarksUri,
        Buffer.from(content, 'utf-8')
      );
    } catch (error) {
      console.error('북마크 저장 중 오류 발생:', error);
    }
  }

  // 세션 목록 가져오기
  getSessions(): CodeSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // 특정 세션 가져오기
  getSession(sessionId: string): CodeSession | undefined {
    return this.sessions.get(sessionId);
  }

  // 현재 활성 세션 가져오기
  getActiveSession(): CodeSession | undefined {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : undefined;
  }

  // 북마크 목록 가져오기
  getBookmarks(): CodeItem[] {
    return [...this.bookmarks]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // 세션 전환
  setActiveSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      return true;
    }
    return false;
  }
}

// 코드 세션 인터페이스
export interface CodeSession {
  id: string;
  name: string;
  items: CodeItem[];
  createdAt: string;
  updatedAt: string;
}

// 코드 아이템 인터페이스
export interface CodeItem {
  id: string;
  code: string;
  result: string;
  hasError: boolean;
  timestamp: string;
}
