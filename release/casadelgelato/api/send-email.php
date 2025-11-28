<?php
/**
 * API endpoint to send emails via SMTP
 * Uses a simple socket-based SMTP class to avoid dependencies like PHPMailer
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

// Simple SMTP Class
class SimpleSMTP {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $secure;
    private $socket;

    public function __construct($host, $port, $user, $pass, $secure = true) {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
        $this->secure = $secure;
    }

    private function log($msg) {
        // error_log("SMTP: " . $msg);
    }

    private function sendCmd($cmd) {
        $this->log("Client: " . $cmd);
        fputs($this->socket, $cmd . "\r\n");
        $response = fgets($this->socket, 512);
        $this->log("Server: " . $response);
        return $response;
    }

    public function send($to, $subject, $body, $fromEmail, $fromName) {
        $protocol = $this->secure ? 'ssl://' : '';
        $this->socket = fsockopen($protocol . $this->host, $this->port, $errno, $errstr, 30);

        if (!$this->socket) {
            throw new Exception("Could not connect to SMTP host: $errstr ($errno)");
        }

        $this->log("Connected to " . $this->host);
        fgets($this->socket, 512); // Initial greeting

        $this->sendCmd("EHLO " . $_SERVER['SERVER_NAME']);
        
        $auth = $this->sendCmd("AUTH LOGIN");
        if (substr($auth, 0, 3) != '334') throw new Exception("SMTP Auth Login failed");

        $user = $this->sendCmd(base64_encode($this->user));
        if (substr($user, 0, 3) != '334') throw new Exception("SMTP Auth User failed");

        $pass = $this->sendCmd(base64_encode($this->pass));
        if (substr($pass, 0, 3) != '235') throw new Exception("SMTP Auth Password failed");

        $this->sendCmd("MAIL FROM: <" . $this->user . ">");
        $this->sendCmd("RCPT TO: <" . $to . ">");
        $this->sendCmd("DATA");

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "From: $fromName <$fromEmail>\r\n";
        $headers .= "Reply-To: $fromEmail\r\n";
        $headers .= "Subject: $subject\r\n";

        $this->sendCmd($headers . "\r\n" . $body . "\r\n.");
        $this->sendCmd("QUIT");

        fclose($this->socket);
        return true;
    }
}

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data || !isset($data['smtpConfig']) || !isset($data['to']) || !isset($data['subject']) || !isset($data['body'])) {
        throw new Exception("Missing required parameters");
    }

    $smtp = $data['smtpConfig'];
    
    $mailer = new SimpleSMTP(
        $smtp['host'],
        $smtp['port'],
        $smtp['user'],
        $smtp['pass'],
        $smtp['secure']
    );

    $mailer->send(
        $data['to'],
        $data['subject'],
        $data['body'],
        $smtp['fromEmail'],
        $smtp['fromName']
    );

    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email: ' . $e->getMessage()]);
}
?>
