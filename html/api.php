<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// DB connection via env vars
$host = getenv('DB_HOST') ?: 'mariadb';
$db   = getenv('DB_NAME') ?: 'bewerbungen';
$user = getenv('DB_USER') ?: 'bewerbung_user';
$pass = getenv('DB_PASS') ?: 'sicheres_passwort123';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB-Verbindung fehlgeschlagen: ' . $e->getMessage()]);
    exit;
}

// --- GET: list all applications ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM applications ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// --- POST: save new application ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (empty($body['company']) || empty($body['app_date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unternehmen und Datum sind Pflichtfelder.']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO applications
            (company, jobtitle, link, contact_name, contact_email, contact_phone, contact_position, app_date, status, notes)
        VALUES
            (:company, :jobtitle, :link, :contact_name, :contact_email, :contact_phone, :contact_position, :app_date, :status, :notes)
    ");

    $stmt->execute([
        ':company'          => trim($body['company']),
        ':jobtitle'         => trim($body['jobtitle']         ?? ''),
        ':link'             => trim($body['link']             ?? ''),
        ':contact_name'     => trim($body['contact_name']     ?? ''),
        ':contact_email'    => trim($body['contact_email']    ?? ''),
        ':contact_phone'    => trim($body['contact_phone']    ?? ''),
        ':contact_position' => trim($body['contact_position'] ?? ''),
        ':app_date'         => $body['app_date'],
        ':status'           => $body['status'] ?? 'Beworben',
        ':notes'            => trim($body['notes'] ?? ''),
    ]);

    $newId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $newId, 'message' => 'Bewerbung gespeichert.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Methode nicht erlaubt.']);
