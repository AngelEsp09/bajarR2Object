require('dotenv').config();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const ENDPOINT_URL = process.env.ENDPOINT_URL;

const nombreDb = 'nombreDB.sql';

const BUCKET_NAME = 'backups';
const OBJECT_KEY = `${nombreDb}`;
const OUTPUT_DIR = './backups';
const OUTPUT_FILE = path.join(OUTPUT_DIR, nombreDb);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Carpeta creada: ${OUTPUT_DIR}`);
}

console.log(`El archivo se esta descargando en: ${OUTPUT_FILE}`);

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: ENDPOINT_URL,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

s3.middlewareStack.add(
    (next) => async (args) => {
        delete args.request.headers['x-amz-checksum-mode'];
        return next(args);
    },
    { step: 'build' }
);

const downloadFile = async () => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: OBJECT_KEY,
        });

        const response = await s3.send(command);

        const fileStream = fs.createWriteStream(OUTPUT_FILE);
        response.Body.pipe(fileStream)
            .on('error', (err) => {
                console.error('Error al escribir el archivo:', err);
            })
            .on('close', () => {
                console.log(`Archivo descargado exitosamente: ${OUTPUT_FILE}`);
            });
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
    }
};

downloadFile();