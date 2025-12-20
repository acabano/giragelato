import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientsFile = path.join(__dirname, 'clienti.txt');

try {
    if (!fs.existsSync(clientsFile)) {
        console.error('❌ Error: clienti.txt file not found!');
        process.exit(1);
    }

    const data = fs.readFileSync(clientsFile, 'utf8');
    // Split by newline, trim whitespace, and filter out empty lines or lines that are just a dot
    const clients = data.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== '.');

    if (clients.length === 0) {
        console.log('⚠️ No clients found in clienti.txt');
        process.exit(0);
    }

    console.log(`📋 Found ${clients.length} clients to process: ${clients.join(', ')}`);

    let successCount = 0;
    let failCount = 0;

    for (const client of clients) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🚀 Starting build for client: ${client}`);
        console.log(`--------------------------------------------------\n`);

        try {
            // Execute the release script for the current client
            // stdio: 'inherit' allows the output of the child process to be seen in the main console
            execSync(`node create-release.js ${client}`, { stdio: 'inherit' });
            console.log(`\n✅ Successfully built for ${client}`);
            successCount++;
        } catch (error) {
            console.error(`\n❌ Failed to build for ${client}`);
            failCount++;
            // We continue to the next client even if one fails
        }
    }

    console.log(`\n==================================================`);
    console.log(`🎉 Batch processing complete.`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`==================================================`);

} catch (err) {
    console.error('Error processing clients:', err);
}
