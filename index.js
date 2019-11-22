const { AbortController } = require("@azure/abort-controller");
const { BlobServiceClient } = require('@azure/storage-blob')
const express = require('express')
const multer = require('multer');
const getStream = require('into-stream');

const app = express();

const { PORT, CONNECT_STR, CONTAINER_NAME, ACCOUNT_NAME } = process.env

const inMemoryStorage = multer.memoryStorage();
const upload = multer({ storage: inMemoryStorage });

app.use(express.static('public'));

uploadFileToBlob = async ({ originalname, size, mimetype, buffer }) => {
  const blobServiceClient = await new BlobServiceClient.fromConnectionString(CONNECT_STR)
  const containerClient = await blobServiceClient.getContainerClient(CONTAINER_NAME)
  const blobClient = containerClient.getBlobClient(originalname)
  const blockBlobClient = blobClient.getBlockBlobClient()

  const stream = getStream(buffer);

  await blockBlobClient.uploadStream(stream, size, 20, {
    abortSignal: AbortController.timeout(30 * 60 * 1000),
    progress: ev => console.log(ev)
  })

  return {
    filename: originalname,
    mimetype,
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

app.post('/', upload.single('file'), uploadFile);

app.listen(PORT, () =>
  console.log(`Running in ${PORT}`)
);