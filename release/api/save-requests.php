<?php
/**
 * API endpoint to save richieste.json (registration requests)
 * Aruba Linux hosting compatible
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json);
    
    if ($data === null || !is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit();
    }
    
    $requestsPath = __DIR__ . '/../data/richieste.json';
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
    
    // Check if file exists and is writable
    if (file_exists($requestsPath) && !is_writable($requestsPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'File exists but is not writable. Check file permissions (should be 664 or 666).']);
        exit();
    }
    
    $result = file_put_contents(
        $requestsPath, 
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    
    if ($result === false) {
        http_response_code(500);
        $error = error_get_last();
        echo json_encode(['error' => 'Failed to write file. ' . ($error ? $error['message'] : 'Unknown error')]);
        exit();
    }
    
    echo json_encode(['success' => true, 'message' => 'Requests saved successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
