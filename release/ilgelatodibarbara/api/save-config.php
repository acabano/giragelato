<?php
/**
 * API endpoint to save config.json
 * Aruba Linux hosting compatible
 */

// CORS headers for development/production
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Read JSON from request body
    $json = file_get_contents('php://input');
    $data = json_decode($json);
    
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit();
    }
    
    // Path to config.json
    $configPath = __DIR__ . '/../data/config.json';
    $dataDir = __DIR__ . '/../data';
    
    // Check if data directory exists and is writable
    if (!is_dir($dataDir)) {
        http_response_code(500);
        echo json_encode(['error' => 'Data directory does not exist: ' . $dataDir]);
        exit();
    }
    
    if (!is_writable($dataDir)) {
        http_response_code(500);
        echo json_encode(['error' => 'Data directory is not writable. Check permissions (should be 775 or 755).']);
        exit();
    }
    
    // Check if file exists and is writable (or if parent directory is writable for new files)
    if (file_exists($configPath) && !is_writable($configPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'File exists but is not writable. Check file permissions (should be 664 or 666).']);
        exit();
    }
    
    // Save with pretty print
    $result = file_put_contents(
        $configPath, 
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    
    if ($result === false) {
        http_response_code(500);
        $error = error_get_last();
        echo json_encode(['error' => 'Failed to write file. ' . ($error ? $error['message'] : 'Unknown error')]);
        exit();
    }
    
    echo json_encode(['success' => true, 'message' => 'Configuration saved successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
