import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get client name from command line arguments
const clientName = process.argv[2];

if (!clientName) {
    console.error('❌ Error: Please specify a client name (subdirectory).');
    console.error('Usage: node create-release.js <client_name>');
    console.error('Example: node create-release.js stellamarina');
    process.exit(1);
}

// Configuration
const baseUrl = `/${clientName}/`;
const releaseRoot = path.join(__dirname, 'release');
const clientReleaseDir = path.join(releaseRoot, clientName);
const distDir = path.join(__dirname, 'dist');
const apiDir = path.join(__dirname, 'api');
const dataDir = path.join(__dirname, 'data');
const imageDir = path.join(__dirname, 'Image');
const legalDir = path.join(__dirname, 'legal');

console.log(`🚀 Starting release build for client: ${clientName}`);
console.log(`📍 Base URL will be: ${baseUrl}`);

// Helper functions
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function removeSync(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copySync(src, dest) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        ensureDirSync(dest);
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copySync(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    } else {
        ensureDirSync(path.dirname(dest));
        fs.copyFileSync(src, dest);
    }
}

// Step 1: Clean client release directory
console.log(`🧹 Cleaning release directory: ${clientReleaseDir}...`);
removeSync(clientReleaseDir);
ensureDirSync(clientReleaseDir);

// Step 2: Build the frontend (Vite)
console.log('🔨 Building frontend with Vite...');
try {
    // Pass VITE_BASE_URL to the build process
    execSync('npm run build', {
        stdio: 'inherit',
        env: {
            ...process.env,
            VITE_BASE_URL: baseUrl
        }
    });
} catch (error) {
    console.error('❌ Build failed!');
    process.exit(1);
}

// Step 3: Copy frontend build files
console.log('📦 Copying frontend build files...');
copySync(distDir, clientReleaseDir);

// Step 4: Copy API backend files
console.log('📡 Copying API backend files...');
const apiReleaseDir = path.join(clientReleaseDir, 'api');
ensureDirSync(apiReleaseDir);
copySync(apiDir, apiReleaseDir);

// Step 5: Copy Image folder (only PNG files)
console.log('🖼️ Copying Image folder (PNG files only)...');
const imageReleaseDir = path.join(clientReleaseDir, 'Image');
ensureDirSync(imageReleaseDir);
if (fs.existsSync(imageDir)) {
    const imageFiles = fs.readdirSync(imageDir).filter(file => file.endsWith('.png'));
    imageFiles.forEach(file => {
        fs.copyFileSync(path.join(imageDir, file), path.join(imageReleaseDir, file));
    });
} else {
    console.warn('⚠️ Image directory not found, skipping images.');
}

// Step 6: Copy .htaccess
console.log('📄 Copying .htaccess...');
// We might need to adjust .htaccess for the subdirectory if it has hardcoded paths, 
// but usually .htaccess in the root of the app is fine if it uses relative paths or RewriteBase.
// For now, we copy it as is.
if (fs.existsSync(path.join(__dirname, '.htaccess'))) {
    fs.copyFileSync(path.join(__dirname, '.htaccess'), path.join(clientReleaseDir, '.htaccess'));
} else {
    console.warn('⚠️ .htaccess not found!');
}

// Step 6b: Copy legal files
console.log('⚖️  Copying legal files...');
const releaseLegalDir = path.join(clientReleaseDir, 'legal');
const clientSourceDir = path.join(__dirname, 'clients', clientName);
const clientLegalDir = path.join(clientSourceDir, 'legal');

// First, check for client-specific legal files
if (fs.existsSync(clientLegalDir)) {
    console.log(`  Found client-specific legal directory at ${clientLegalDir}`);
    console.log(`  Copying to ${releaseLegalDir}...`);
    copySync(clientLegalDir, releaseLegalDir);
} else if (fs.existsSync(legalDir)) {
    // Fallback to generic legal directory from project root
    console.log(`  Found generic legal directory at ${legalDir}`);
    console.log(`  Copying to ${releaseLegalDir}...`);
    copySync(legalDir, releaseLegalDir);
} else {
    console.log(`  ⚠️  No legal directory found. Skipping.`);
}

// Step 7: Setup data directory
console.log('📂 Setting up data directory...');
const dataReleaseDir = path.join(clientReleaseDir, 'data');
ensureDirSync(dataReleaseDir);

// Copy all JSON files from source data directory, except the ones we'll create defaults for
const sourceDataFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
const excludeFiles = ['config.json', 'giocate.json', 'richieste.json'];

sourceDataFiles.forEach(file => {
    if (file.endsWith('.json') && !excludeFiles.includes(file)) {
        console.log(`  Copying ${file}...`);
        fs.copyFileSync(
            path.join(dataDir, file),
            path.join(dataReleaseDir, file)
        );
    }
});

// Create default config.json
const defaultConfig = {
    nomeDellaRuota: "Gira Gelato",
    numeroSpicchi: 8,
    tema: "Gelato",
    numeroVinciteGiornaliere: 1,
    numeroGiocate: 1,
    premi: [
        { premio: "Cono Gelato", vincita: true, valore: 100 },
        { premio: "Foglia Secca", vincita: false, valore: 0 },
        { premio: "Panna Montata", vincita: true, valore: 50 },
        { premio: "Cono Rotto", vincita: false, valore: 0 },
        { premio: "Pinguinatura", vincita: true, valore: 200 },
        { premio: "Sasso Comune", vincita: false, valore: 0 },
        { premio: "Bisquit", vincita: true, valore: 150 },
        { premio: "Pigna", vincita: false, valore: 0 }
    ],
    active: true,
    adminEmail: "",
    winningPercentage: 5,
    emailProvider: "emailjs"
};

fs.writeFileSync(
    path.join(dataReleaseDir, 'config.json'),
    JSON.stringify(defaultConfig, null, 4),
    'utf-8'
);
console.log('  Created default config.json');

// Create default giocate.json (empty array)
fs.writeFileSync(
    path.join(dataReleaseDir, 'giocate.json'),
    JSON.stringify([], null, 4),
    'utf-8'
);
console.log('  Created empty giocate.json');

// Create default richieste.json (empty array)
fs.writeFileSync(
    path.join(dataReleaseDir, 'richieste.json'),
    JSON.stringify([], null, 4),
    'utf-8'
);
console.log('  Created empty richieste.json');

// Create default users.json only if no users_*.json file exists in source
const hasUserFile = sourceDataFiles.some(file => file.match(/^users.*\.json$/));
if (!hasUserFile) {
    const defaultUsers = [
        {
            user: "admin",
            password: "admin",
            role: "admin",
            history: []
        },
        {
            user: "testuser",
            password: "password123",
            role: "user",
            history: []
        }
    ];

    fs.writeFileSync(
        path.join(dataReleaseDir, 'users.json'),
        JSON.stringify(defaultUsers, null, 4),
        'utf-8'
    );
    console.log('  Created default users.json');
} else {
    console.log('  User file already copied from source data directory');
}

console.log('✅ Release build complete!');
console.log(`📦 Release files are in: ${clientReleaseDir}`);
console.log('\n📋 Deployment checklist:');
console.log(`  1. Upload the CONTENTS of '${clientReleaseDir}' to 'https://yourdomain.com/${clientName}/'`);
console.log('  2. Ensure the data/ directory is writable by the web server (chmod 777 or similar)');
console.log('  3. Test the application!');

