
const { AbortController } = require("@azure/abort-controller");
const { BlobServiceClient } = require('@azure/storage-blob')
const express = require('express')
const multer = require('multer');

const app = express();

// const { PORT, CONNECT_STR, CONTAINER_NAME, ACCOUNT_NAME } = process.env
const CONTAINER_NAME = 'TESTE';
const ACCOUNT_NAME = 'TESTE';
const PORT = 3000

const inMemoryStorage = multer.memoryStorage();
const upload = multer({ storage: inMemoryStorage });

app.use(express.static('public'));

uploadFileToBlob = async ({ originalname, size, mimetype }) => {
  return {
    filename: originalname,
    mimetype,
    size,
    url: `https://${ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${originalname}`
  }
};

const uploadFile = async (req, res, next) => {
  try {
    return res.json(
      await uploadFileToBlob(req.file)
    );
  } catch (error) {
    next(error);
  }
}

app.post('/upload', upload.single('file'), uploadFile);

app.listen(PORT, () =>
  console.log(`Running in ${PORT}`)
);
