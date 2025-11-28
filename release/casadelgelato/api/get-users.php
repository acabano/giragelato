<?php
/**
 * API endpoint to retrieve users.json securely
 * Acts as a proxy so the actual file can be protected from direct access
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$dataDir = __DIR__ . '/../data';
$usersPath = $dataDir . '/users_7d9f2a.json'; // Default secure path

// Fallback: Scan for any users*.json file if the specific one doesn't exist
if (!file_exists($usersPath) && is_dir($dataDir)) {
    $files = scandir($dataDir);
    foreach ($files as $file) {
        if (strpos($file, 'users') === 0 && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
            $usersPath = $dataDir . '/' . $file;
            break; 
        }
    }
}

if (!file_exists($usersPath)) {
    // Return empty array if no users file found
    echo json_encode([]);
    exit();
}

// Output the file content
readfile($usersPath);
?>
