# LAMP project for POOSD lab
A full-stack Color Manager built with the LAMP stack. 
The frontend is HTML/CSS, and the backend consists of PHP API endpoints.  

There is login functionality, and you can privately record and add colors.

https://4331c-colors-ethanzeng.online/

## Linting

The Lint and tests workflow runs on pushes and pull requests. It uses HTMLHint
for HTML, Stylelint for CSS, and ESLint for browser JavaScript and test files.

Run the same checks locally from the repository root with Node.js 22:

```sh
npm ci --ignore-scripts
npm run lint
```

## Tests

Jest runs frontend unit tests with jsdom and integration tests against the PHP
API and MySQL. Node.js provides the development tools, while PHP serves the
application during integration tests.

Run the frontend unit tests with:

```sh
npm run test:unit
```

For integration tests, install PHP 8.5 with `mysqli` enabled and run a local
MySQL 8 server. Supply a test account that can create and drop databases. For
example, in PowerShell:

```powershell
$env:TEST_DB_HOST = "127.0.0.1"
$env:TEST_DB_PORT = "3306"
$env:TEST_DB_USER = "test_user"
$env:TEST_DB_PASSWORD = "your-local-test-password"
npm run test:integration
```

Use `npm test` to run both suites. The integration suite creates a temporary
copy of the PHP API, writes its test configuration there, and imports the
repository schema into a uniquely named test database. It starts a PHP server
and cleans up the server, test database, and temporary files after the tests.
`PHP_BINARY` can specify a PHP executable outside your `PATH`.

The frontend tests check validation, requests, and displayed results. The API
tests check login responses, persisted color insertion, JSON response fields,
and search filtering by user. GitHub Actions provisions PHP and MySQL and
runs both suites with `npm test -- --ci`. Results appear in the Actions logs.
