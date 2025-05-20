#!/bin/bash

# D: 드라이브로 이동
cd /d/vscode-python-runner

# TypeScript 컴파일 실행
tsc -p ./

# DEBUG: 컴파일 로그 출력
echo "extension.ts 및 다른 주요 파일 컴파일 완료"

# 디버그 웹뷰 파일 별도 컴파일
tsc -p ./debug/tsconfig.json

echo "디버그 웹뷰 컴파일 완료"
