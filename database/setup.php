<?php
/**
 * EVENTIFY — Automated Database Setup & Migration Script
 * Automatically connects to MySQL, creates database `eventify_db`, and imports all tables & seed data.
 */

header('Content-Type: text/html; charset=utf-8');

$host = isset($_POST['host']) ? $_POST['host'] : 'localhost';
$user = isset($_POST['user']) ? $_POST['user'] : 'root';
$pass = isset($_POST['pass']) ? $_POST['pass'] : '';
$dbname = isset($_POST['dbname']) ? $_POST['dbname'] : 'eventify_db';

$status = null;
$message = '';
$details = [];

$isCli = (php_sapi_name() === 'cli');
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? ($isCli ? 'POST' : 'GET');

if ($requestMethod === 'POST' || isset($_GET['auto']) || $isCli) {
    try {
        // 1. Connect to MySQL server (without selecting DB first)
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        // 2. Create Database if not exists
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$dbname`");
        $details[] = "<i class="fa-solid fa-check"></i> Connected to MySQL server successfully.";
        $details[] = "<i class="fa-solid fa-check"></i> Created/Verified database: <strong>$dbname</strong>";

        // 3. Read SQL schema file
        $sqlPath = __DIR__ . '/eventify.sql';
        if (!file_exists($sqlPath)) {
            throw new Exception("Schema file 'eventify.sql' not found in " . __DIR__);
        }

        $sqlContent = file_get_contents($sqlPath);

        // Execute SQL script
        $pdo->exec($sqlContent);
        $details[] = "<i class="fa-solid fa-check"></i> Successfully executed all SQL migrations and initialized tables.";

        // Count seeded records
        $stmtUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $stmtEvents = $pdo->query("SELECT COUNT(*) FROM events")->fetchColumn();
        $stmtVenues = $pdo->query("SELECT COUNT(*) FROM venues")->fetchColumn();
        $stmtBookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
        $stmtPromos = $pdo->query("SELECT COUNT(*) FROM promos")->fetchColumn();
        $stmtReviews = $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();

        $details[] = "<i class="fa-solid fa-check"></i> Seeded <strong>$stmtUsers</strong> Users, <strong>$stmtEvents</strong> Events, <strong>$stmtVenues</strong> Venues, <strong>$stmtBookings</strong> Bookings, <strong>$stmtPromos</strong> Promo Codes, <strong>$stmtReviews</strong> Reviews.";

        $status = 'success';
        $message = "Database setup and seeding completed successfully!";
    } catch (PDOException $e) {
        $status = 'error';
        $message = "Database Error: " . $e->getMessage();
    } catch (Exception $e) {
        $status = 'error';
        $message = "System Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Setup — Eventify</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/dashboard.css">
  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.15), transparent 40%),
                  var(--bg-primary);
      padding: 1.5rem;
    }
    .setup-card {
      max-width: 600px;
      width: 100%;
      background: var(--bg-glass-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      box-shadow: var(--shadow-glow);
    }
    .log-box {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      margin: 1.5rem 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <div class="setup-card">
    <div style="text-align: center; margin-bottom: 2rem;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-ticket"></i></div>
      <h1 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Eventify Database Setup</h1>
      <p class="text-secondary text-sm">Automated MySQL Database Creation & Seed Migration</p>
    </div>

    <?php if ($status === 'success'): ?>
      <div class="alert alert-success" style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: var(--success); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
        <strong><i class="fa-solid fa-party-horn"></i> <?php echo htmlspecialchars($message); ?></strong>
      </div>
      
      <div class="log-box">
        <?php foreach ($details as $line): ?>
          <div><?php echo $line; ?></div>
        <?php endforeach; ?>
      </div>

      <div class="flex gap-3" style="margin-top: 2rem;">
        <a href="../login.html" class="btn btn-primary btn-full">Proceed to Login Portal →</a>
        <a href="../admin/dashboard.html" class="btn btn-outline btn-full">Admin Dashboard</a>
      </div>

    <?php elseif ($status === 'error'): ?>
      <div class="alert alert-danger" style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: var(--danger); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <strong>❌ <?php echo htmlspecialchars($message); ?></strong>
      </div>

      <form method="POST">
        <div class="form-group">
          <label class="form-label">MySQL Host</label>
          <input type="text" name="host" class="form-control" value="<?php echo htmlspecialchars($host); ?>" required>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">DB User</label>
            <input type="text" name="user" class="form-control" value="<?php echo htmlspecialchars($user); ?>" required>
          </div>
          <div class="form-group">
            <label class="form-label">DB Password</label>
            <input type="password" name="pass" class="form-control" value="<?php echo htmlspecialchars($pass); ?>" placeholder="Leave blank if none">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Database Name</label>
          <input type="text" name="dbname" class="form-control" value="<?php echo htmlspecialchars($dbname); ?>" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top: 1rem;">Retry Setup & Initialize DB</button>
      </form>

    <?php else: ?>
      <form method="POST">
        <p class="text-secondary text-sm" style="margin-bottom: 1.5rem;">
          Click the button below to initialize the MySQL database (<strong>eventify_db</strong>) and populate it with seed events, venues, bookings, promo codes, and demo accounts.
        </p>
        <div class="form-group">
          <label class="form-label">MySQL Host</label>
          <input type="text" name="host" class="form-control" value="localhost" required>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">DB User</label>
            <input type="text" name="user" class="form-control" value="root" required>
          </div>
          <div class="form-group">
            <label class="form-label">DB Password</label>
            <input type="password" name="pass" class="form-control" value="" placeholder="(Empty for default XAMPP/WAMP)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Database Name</label>
          <input type="text" name="dbname" class="form-control" value="eventify_db" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top: 1rem; padding: 0.85rem;">
          🚀 Initialize Eventify Database
        </button>
      </form>
    <?php endif; ?>
  </div>

</body>
</html>
