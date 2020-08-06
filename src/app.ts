import { BlobServiceClient, BlobItem, ContainerClient } from '@azure/storage-blob';
import multer, { memoryStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application, Router } from 'express';
import intoStream from 'into-stream';
import path from 'path';
import mime from 'mime-types';

dotenv.config();

const { PORT, CONNECT_STR, CONTAINER_NAME, ACCOUNT_NAME } = process.env;

class App {
  public express: Application;
  private multer: any;

  constructor() {
    this.express = express();
    this.multer = multer({
      storage: memoryStorage()
    });

    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.express.use(cors());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({
      extended: true
    }));
  }

  private routes() {
    const router = Router();

    router.post('/upload', this.multer.single('file'), async (req, res) => res.json(
      await this.uploadFile(req.file)
    ));

    router.get('/upload', (_req, res) => res.sendFile(
      path.join(__dirname, '..', 'public', 'upload.html')
    ));

    router.get('/', async (_req, res) => res.json(
      await this.listFiles()
    ));

    this.express.use(router);
  }

  private get container(): ContainerClient {
    return BlobServiceClient
      .fromConnectionString(CONNECT_STR as string)
      .getContainerClient(CONTAINER_NAME as string);
  }

  private async uploadFile({ originalname, size, mimetype, buffer }: Express.Multer.File): Promise<object> {
    const filename = uuid() + path.extname(originalname);
    const stream = intoStream(buffer);

    await this.container
      .getBlobClient(filename)
      .getBlockBlobClient()
      .uploadStream(stream, size, 20);

    return {
      filename,
      mimetype,
      url: `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${filename}`,
    }
  }

  private async listFiles(): Promise<object[]> {
    const files = this.container.listBlobsFlat();
    const blobs = [];

    const url = ({ name }: BlobItem) => `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${name}`;

    const contentType = ({ name }: BlobItem) => {
      const ext = path.extname(name);
      return mime.contentType(ext);
    }

    for await (const file of files) {
      blobs.push({
        filename: file.name,
        mimetype: contentType(file),
        url: url(file)
      });
    }

    return blobs;
  }
}

export { PORT, App };
