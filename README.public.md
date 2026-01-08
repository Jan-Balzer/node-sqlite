<!--
@license
Copyright (c) 2025 Rljson

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# node-sqlite

A Node.js SQLite wrapper using the native `node:sqlite` module (available in Node.js 22.14.0+).

## Installation

```bash
npm install node-sqlite
```

## Requirements

- Node.js >= 22.14.0

## Features

- ✅ Native Node.js SQLite support (no native bindings required)
- ✅ Simple and intuitive API
- ✅ TypeScript support with full type definitions
- ✅ Transaction support
- ✅ Prepared statements
- ✅ In-memory and file-based databases
- ✅ Comprehensive error handling

## Quick Start

```typescript
import { NodeSQLite } from 'node-sqlite';

// Create an in-memory database
const db = NodeSQLite.inMemory();

// Create a table
db.execute(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

// Insert data
db.execute(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  'Alice',
  'alice@example.com'
);

// Query data
const users = db.query('SELECT * FROM users');
console.log(users);

// Query single row
const user = db.queryOne('SELECT * FROM users WHERE name = ?', 'Alice');
console.log(user);

// Use transactions
db.transaction(() => {
  db.execute('INSERT INTO users (name, email) VALUES (?, ?)', 'Bob', 'bob@example.com');
  db.execute('INSERT INTO users (name, email) VALUES (?, ?)', 'Charlie', 'charlie@example.com');
});

// Close the database
db.close();
```

## API Documentation

### Opening a Database

```typescript
// In-memory database
const db = NodeSQLite.inMemory();

// File-based database
const db = new NodeSQLite();
db.open('/path/to/database.db');
```

### Executing SQL

```typescript
// Execute without returning results
const result = db.execute('INSERT INTO users (name) VALUES (?)', 'Alice');
console.log(result.lastInsertRowid); // ID of inserted row
console.log(result.changes); // Number of rows affected
```

### Querying Data

```typescript
// Query all matching rows
const users = db.query('SELECT * FROM users WHERE age > ?', 18);

// Query single row
const user = db.queryOne('SELECT * FROM users WHERE id = ?', 1);

// With TypeScript types
interface User {
  id: number;
  name: string;
  email: string;
}
const typedUsers = db.query<User>('SELECT * FROM users');
```

### Transactions

```typescript
db.transaction(() => {
  db.execute('UPDATE accounts SET balance = balance - 100 WHERE id = ?', 1);
  db.execute('UPDATE accounts SET balance = balance + 100 WHERE id = ?', 2);
});
// Automatically commits on success or rolls back on error
```

### Prepared Statements

```typescript
const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
stmt.run('Alice', 'alice@example.com');
stmt.run('Bob', 'bob@example.com');
```

## Example

See [src/example.ts](src/example.ts) for a complete example.

Run the example with:
```bash
npx vite-node src/example.ts
```

## License

MIT
