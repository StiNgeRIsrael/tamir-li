import app from './app';
import { startConversionWorker } from './lib/conversion-worker';
import { runStartupMigrations } from './lib/startup-migrate';

const PORT = process.env.PORT || 5000;

runStartupMigrations();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startConversionWorker();
});
