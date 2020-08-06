import { App, PORT } from './app';

const { express } = new App();

express.listen(PORT, () =>
  console.log(`Running in ${PORT}`)
);
