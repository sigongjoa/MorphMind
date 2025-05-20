import * as vscode from 'vscode';

// 웹뷰와 확장 간 메시지 타입
export interface Message {
    command: string;
    [key: string]: any;
}

// 로그 레벨 정의
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

// 로그 메시지 포맷
export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    trace?: string;
}

// 세션 데이터 인터페이스
export interface SessionData {
    id: string;
    name: string;
    codeItems: CodeItem[];
    timestamp: string;
}

// 북마크 데이터 인터페이스
export interface BookmarkData {
    id: string;
    name: string;
    code: string;
    timestamp: string;
}

// 코드 실행 결과 인터페이스
export interface CodeOutput {
    hasError: boolean;
    textOutput: string;
    imageData?: string;
    errorAnalysis?: string;
}

// 코드 아이템 인터페이스
export interface CodeItem {
    id: string;
    code: string;
    output?: CodeOutput;
    timestamp: string;
}

// 변수 데이터 인터페이스
export interface VariableData {
    name: string;
    value: any;
    type: string;
    expandable: boolean;
    children?: VariableData[];
}
