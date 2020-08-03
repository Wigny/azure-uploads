import { BlobServiceClient } from "@azure/storage-blob";
import { memoryStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import getStream from 'into-stream';
import multer from 'multer';
import path from 'path';

const app = express();
const upload = multer({
  storage: memoryStorage()
});
dotenv.config();

const { PORT, CONNECT_STR, CONTAINER_NAME, ACCOUNT_NAME } = process.env;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const container = BlobServiceClient
  .fromConnectionString(CONNECT_STR as string)
  .getContainerClient(CONTAINER_NAME as string);

const uploadFile = async ({ originalname, size, mimetype, buffer }: Express.Multer.File) => {
  const filename = uuid() + path.extname(originalname);
  const stream = getStream(buffer);

  await container
    .getBlobClient(filename)
    .getBlockBlobClient()
    .uploadStream(stream, size, 20);

  return {
    filename,
    mimetype,
    url: `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${filename}`,
  }
};

const listFiles = async () => {
  const blobs = [];

  for await (const { name } of container.listBlobsFlat()) {
    blobs.push(`https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${name}`);
  }

  return blobs;
}

app.post('/upload', upload.single('file'), async (req, res) => res.json(
  await uploadFile(req.file)
));

app.get('/upload', (_req, res) => res.sendFile(
  path.join(__dirname, '..', 'src', 'upload.html')
));

app.get('/', async (_req, res) => res.json(
  await listFiles()
));

app.listen(PORT, () =>
  console.log(`Running in ${PORT}`)
);
