export function detectErrorType(errorMessage: string): string {
    const errorTypes = [
      'SyntaxError', 'NameError', 'TypeError', 'IndexError',
      'KeyError', 'ValueError', 'ImportError', 'AttributeError',
      'IndentationError', 'ZeroDivisionError'
    ];
    
    for (const errorType of errorTypes) {
      if (errorMessage.includes(errorType)) {
        return errorType;
      }
    }
    
    return 'UnknownError';
}
