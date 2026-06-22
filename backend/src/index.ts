import app from './app';
import { startConversionWorker } from './lib/conversion-worker';
import { runStartupMigrations } from './lib/startup-migrate';

const PORT = process.env.PORT || 5000;

// Listen first so Passenger sees the process as ready; migrate in the background.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startConversionWorker();
    setImmediate(() => runStartupMigrations());
});
