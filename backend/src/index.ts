import app from './app';
import { startConversionWorker } from './lib/conversion-worker';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startConversionWorker();
});
