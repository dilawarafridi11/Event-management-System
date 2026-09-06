<?php
/**
 * EVENTIFY — Database Connection (PDO Singleton)
 */

class Database {
    private static $host = 'localhost';
    private static $db_name = 'eventify_db';
    private static $username = 'root';
    private static $password = '';
    private static $conn = null;

    /**
     * Get active PDO database connection
     * @return PDO|null
     */
    public static function getConnection() {
        if (self::$conn === null) {
            try {
                $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db_name . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                self::$conn = new PDO($dsn, self::$username, self::$password, $options);
            } catch (PDOException $e) {
                // Return clean JSON error if connection fails
                header('Content-Type: application/json; charset=utf-8');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage(),
                    'error_code' => 'DB_CONNECTION_FAILED'
                ]);
                exit;
            }
        }
        return self::$conn;
    }
}
