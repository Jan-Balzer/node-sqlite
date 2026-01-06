// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { NodeSQLite } from './node-sqlite.ts';


export const example = () => {
  // Print methods
  const l = console.log;
  const h1 = (text: string) => l(`\n${text}`);
  const h2 = (text: string) => l(`  ${text}`);
  const p = (text: string) => l(`    ${text}`);

  // Example 1: In-memory database
  h1('NodeSQLite.inMemory()');
  h2('Creates an in-memory SQLite database instance.');
  const memDb = NodeSQLite.inMemory();
  p(`Database open: ${memDb.isOpen()}`);
  p(`Database path: ${memDb.getPath()}`);
  
  // Create a table
  h2('Creating a users table...');
  memDb.execute(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);
  p('Table created successfully');

  // Insert data
  h2('Inserting users...');
  const result1 = memDb.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    'Alice',
    'alice@example.com'
  );
  p(`Inserted row ID: ${result1.lastInsertRowid}`);
  
  const result2 = memDb.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    'Bob',
    'bob@example.com'
  );
  p(`Inserted row ID: ${result2.lastInsertRowid}`);

  // Query data
  h2('Querying all users...');
  const users = memDb.query('SELECT * FROM users');
  p(JSON.stringify(users, null, 2));

  // Query one user
  h2('Querying one user...');
  const user = memDb.queryOne('SELECT * FROM users WHERE name = ?', 'Alice');
  p(JSON.stringify(user, null, 2));

  // Transaction example
  h2('Using a transaction...');
  memDb.transaction(() => {
    memDb.execute('UPDATE users SET email = ? WHERE name = ?', 'alice.new@example.com', 'Alice');
    memDb.execute('INSERT INTO users (name, email) VALUES (?, ?)', 'Charlie', 'charlie@example.com');
  });
  p('Transaction completed');

  const allUsers = memDb.query('SELECT * FROM users');
  p(JSON.stringify(allUsers, null, 2));

  // Close database
  memDb.close();
  h2('Database closed');
};

/*
// Run via "npx vite-node src/example.ts"
example();
*/
