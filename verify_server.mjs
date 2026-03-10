import http from 'http';

const req = http.get('http://localhost:3000', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        console.log('BODY HEAD:', body.slice(0, 100)); // Print first 100 chars
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.end();
