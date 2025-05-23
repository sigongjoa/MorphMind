async function httpRequest(url: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
}): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    json: () => Promise<any>;
}> {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = lib.request(requestOptions, (res: any) => {
            let data = '';
            
            res.on('data', (chunk: any) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage || '',
                    json: async () => JSON.parse(data)
                });
            });
        });
        
        req.on('error', (error: Error) => {
            reject(error);
        });
        
        if (options.timeout) {
            req.setTimeout(options.timeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        }
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

export { httpRequest };
