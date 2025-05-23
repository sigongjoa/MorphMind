async function httpPost(url: string, data: any, options?: {
    timeout?: number;
    headers?: Record<string, string>;
}): Promise<any> {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;
        
        const postData = JSON.stringify(data);
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...options?.headers
            }
        };
        
        const req = lib.request(requestOptions, (res: any) => {
            let responseData = '';
            
            res.on('data', (chunk: any) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(responseData));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse JSON response: ${responseData}`));
                }
            });
        });
        
        req.on('error', (error: Error) => {
            reject(error);
        });
        
        if (options?.timeout) {
            req.setTimeout(options.timeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        }
        
        req.write(postData);
        req.end();
    });
}

export { httpPost };
