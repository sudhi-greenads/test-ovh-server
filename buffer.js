

const stringToBase64 = (str) => {
    return Buffer.from(str, 'utf-8').toString('base64');
};

const base64ToString = (base64) => {
    return Buffer.from(base64, 'base64').toString('utf-8');
};


// console.log(stringToBase64('Hello, World!')); // Outputs: SGVsbG8sIFdvcmxkIQ==
console.log(base64ToString('cG9zdGdyZXNxbDovL2FwcDpQTmk1TmdZVWhHREJJY1ZqODZFaWNCNmFjWTdZbnlEUVpOMEthQ3VZSFFlMW5pZ1pTdk1ER1g2ZGNLU0k5OExaQDE0OC4xMTMuNDkuMjM6NTQzMi9nYV9hbmFseXRpY3M')); // Outputs: Hello, World!