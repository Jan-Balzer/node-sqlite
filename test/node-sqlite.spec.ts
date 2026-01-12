// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { NodeSQLite } from '../src/node-sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('NodeSQLite', () => {
  let db: NodeSQLite;
  let tempDbPath: string;

  beforeEach(() => {
    db = new NodeSQLite();
    // Create a unique temp file path for each test
    tempDbPath = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random()}.db`);
  });

  afterEach(() => {
    // Clean up: close database if open and delete temp file
    if (db.isOpen()) {
      db.close();
    }
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  describe('Database Connection', () => {
    it('should open an in-memory database', () => {
      db.open(':memory:');
      expect(db.isOpen()).toBe(true);
      expect(db.getPath()).toBe(':memory:');
    });

    it('should open a file-based database', () => {
      db.open(tempDbPath);
      expect(db.isOpen()).toBe(true);
      expect(db.getPath()).toBe(tempDbPath);
      expect(fs.existsSync(tempDbPath)).toBe(true);
    });

    it('should throw error when opening already open database', () => {
      db.open(':memory:');
      expect(() => db.open(':memory:')).toThrow('Database is already open');
    });

    it('should close an open database', () => {
      db.open(':memory:');
      db.close();
      expect(db.isOpen()).toBe(false);
      expect(db.getPath()).toBe(null);
    });

    it('should throw error when closing a non-open database', () => {
      expect(() => db.close()).toThrow('Database is not open');
    });

    it('should create in-memory database using static method', () => {
      const memDb = NodeSQLite.inMemory();
      expect(memDb.isOpen()).toBe(true);
      expect(memDb.getPath()).toBe(':memory:');
      memDb.close();
    });

    it('should return example instance', () => {
      const exampleDb = NodeSQLite.example;
      expect(exampleDb).toBeDefined();
      expect(exampleDb.isOpen()).toBe(true);
      exampleDb.close();
    });
  });

  describe('SQL Execution', () => {
    beforeEach(() => {
      db.open(':memory:');
      db.execute(`
        CREATE TABLE test_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value INTEGER
        )
      `);
    });

    it('should execute CREATE TABLE statement', () => {
      db.execute(`
        CREATE TABLE another_table (
          id INTEGER PRIMARY KEY,
          data TEXT
        )
      `);
      // Verify table exists by querying sqlite_master
      const tables = db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='another_table'"
      );
      expect(tables).toHaveLength(1);
    });

    it('should execute INSERT statement and return lastInsertRowid', () => {
      const result = db.execute(
        'INSERT INTO test_table (name, value) VALUES (?, ?)',
        'test',
        42
      );
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);
    });

    it('should execute UPDATE statement and return changes count', () => {
      db.execute('INSERT INTO test_table (name, value) VALUES (?, ?)', 'test1', 10);
      db.execute('INSERT INTO test_table (name, value) VALUES (?, ?)', 'test2', 20);
      
      const result = db.execute('UPDATE test_table SET value = ? WHERE value > ?', 100, 5);
      expect(result.changes).toBe(2);
    });

    it('should execute DELETE statement', () => {
      db.execute('INSERT INTO test_table (name, value) VALUES (?, ?)', 'test1', 10);
      db.execute('INSERT INTO test_table (name, value) VALUES (?, ?)', 'test2', 20);
      
      const result = db.execute('DELETE FROM test_table WHERE value = ?', 10);
      expect(result.changes).toBe(1);
    });

    it('should throw error when executing on closed database', () => {
      db.close();
      expect(() => db.execute('SELECT 1')).toThrow('Database is not open');
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      db.open(':memory:');
      db.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          age INTEGER
        )
      `);
      db.execute('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', 'Alice', 'alice@test.com', 30);
      db.execute('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', 'Bob', 'bob@test.com', 25);
      db.execute('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', 'Charlie', 'charlie@test.com', 35);
    });

    it('should query all rows', () => {
      const users = db.query('SELECT * FROM users ORDER BY id');
      expect(users).toHaveLength(3);
      expect(users[0]).toMatchObject({ name: 'Alice', email: 'alice@test.com', age: 30 });
      expect(users[1]).toMatchObject({ name: 'Bob', email: 'bob@test.com', age: 25 });
      expect(users[2]).toMatchObject({ name: 'Charlie', email: 'charlie@test.com', age: 35 });
    });

    it('should query with parameters', () => {
      const users = db.query('SELECT * FROM users WHERE age > ?', 28);
      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({ name: 'Alice' });
      expect(users[1]).toMatchObject({ name: 'Charlie' });
    });

    it('should query with typed results', () => {
      interface User {
        id: number;
        name: string;
        email: string;
        age: number;
      }
      const users = db.query<User>('SELECT * FROM users WHERE name = ?', 'Alice');
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Alice');
      expect(users[0].age).toBe(30);
    });

    it('should return empty array when no results', () => {
      const users = db.query('SELECT * FROM users WHERE name = ?', 'NonExistent');
      expect(users).toHaveLength(0);
      expect(users).toEqual([]);
    });

    it('should throw error when querying on closed database', () => {
      db.close();
      expect(() => db.query('SELECT * FROM users')).toThrow('Database is not open');
    });
  });

  describe('Query One Operations', () => {
    beforeEach(() => {
      db.open(':memory:');
      db.execute(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL
        )
      `);
      db.execute('INSERT INTO products (name, price) VALUES (?, ?)', 'Product A', 10.99);
      db.execute('INSERT INTO products (name, price) VALUES (?, ?)', 'Product B', 20.99);
    });

    it('should query one row', () => {
      const product = db.queryOne('SELECT * FROM products WHERE name = ?', 'Product A');
      expect(product).toBeDefined();
      expect(product).toMatchObject({ name: 'Product A', price: 10.99 });
    });

    it('should return null when no result', () => {
      const product = db.queryOne('SELECT * FROM products WHERE name = ?', 'NonExistent');
      expect(product).toBeNull();
    });

    it('should return first row when multiple matches', () => {
      db.execute('INSERT INTO products (name, price) VALUES (?, ?)', 'Product C', 15.99);
      const product = db.queryOne('SELECT * FROM products WHERE price < ?', 25);
      expect(product).toBeDefined();
      expect(product).toMatchObject({ name: 'Product A' });
    });

    it('should query one with typed result', () => {
      interface Product {
        id: number;
        name: string;
        price: number;
      }
      const product = db.queryOne<Product>('SELECT * FROM products WHERE id = ?', 1);
      expect(product).not.toBeNull();
      expect(product?.name).toBe('Product A');
      expect(product?.price).toBe(10.99);
    });

    it('should throw error when querying one on closed database', () => {
      db.close();
      expect(() => db.queryOne('SELECT * FROM products')).toThrow('Database is not open');
    });
  });

  describe('Prepared Statements', () => {
    beforeEach(() => {
      db.open(':memory:');
      db.execute(`
        CREATE TABLE items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);
    });

    it('should prepare and execute statement multiple times', () => {
      const stmt = db.prepare('INSERT INTO items (name) VALUES (?)');
      
      stmt.run('Item 1');
      stmt.run('Item 2');
      stmt.run('Item 3');
      
      const items = db.query('SELECT * FROM items');
      expect(items).toHaveLength(3);
    });

    it('should prepare and query with statement', () => {
      db.execute('INSERT INTO items (name) VALUES (?)', 'Test Item');
      
      const stmt = db.prepare('SELECT * FROM items WHERE name = ?');
      const result = stmt.get('Test Item');
      
      expect(result).toBeDefined();
      expect(result).toMatchObject({ name: 'Test Item' });
    });

    it('should throw error when preparing on closed database', () => {
      db.close();
      expect(() => db.prepare('SELECT * FROM items')).toThrow('Database is not open');
    });
  });

  describe('Transactions', () => {
    beforeEach(() => {
      db.open(':memory:');
      db.execute(`
        CREATE TABLE accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          balance INTEGER NOT NULL
        )
      `);
      db.execute('INSERT INTO accounts (name, balance) VALUES (?, ?)', 'Account A', 1000);
      db.execute('INSERT INTO accounts (name, balance) VALUES (?, ?)', 'Account B', 500);
    });

    it('should commit transaction on success', () => {
      db.transaction(() => {
        db.execute('UPDATE accounts SET balance = balance - ? WHERE name = ?', 100, 'Account A');
        db.execute('UPDATE accounts SET balance = balance + ? WHERE name = ?', 100, 'Account B');
      });

      const accountA = db.queryOne('SELECT balance FROM accounts WHERE name = ?', 'Account A');
      const accountB = db.queryOne('SELECT balance FROM accounts WHERE name = ?', 'Account B');
      
      expect(accountA).toMatchObject({ balance: 900 });
      expect(accountB).toMatchObject({ balance: 600 });
    });

    it('should rollback transaction on error', () => {
      expect(() => {
        db.transaction(() => {
          db.execute('UPDATE accounts SET balance = balance - ? WHERE name = ?', 100, 'Account A');
          throw new Error('Transaction failed');
        });
      }).toThrow('Transaction failed');

      const accountA = db.queryOne('SELECT balance FROM accounts WHERE name = ?', 'Account A');
      expect(accountA).toMatchObject({ balance: 1000 }); // Original value
    });

    it('should return value from transaction', () => {
      const result = db.transaction(() => {
        db.execute('UPDATE accounts SET balance = balance + ? WHERE name = ?', 50, 'Account A');
        const account = db.queryOne('SELECT balance FROM accounts WHERE name = ?', 'Account A');
        return account;
      });

      expect(result).toMatchObject({ balance: 1050 });
    });

    it('should throw error when using transaction on closed database', () => {
      db.close();
      expect(() => db.transaction(() => {})).toThrow('Database is not open');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query results', () => {
      db.open(':memory:');
      db.execute('CREATE TABLE empty_table (id INTEGER)');
      
      const results = db.query('SELECT * FROM empty_table');
      expect(results).toEqual([]);
    });

    it('should handle NULL values', () => {
      db.open(':memory:');
      db.execute('CREATE TABLE nullable_table (id INTEGER, data TEXT)');
      db.execute('INSERT INTO nullable_table (id, data) VALUES (?, ?)', 1, null);
      
      const result = db.queryOne('SELECT * FROM nullable_table WHERE id = ?', 1);
      expect(result).toMatchObject({ id: 1, data: null });
    });

    it('should handle special characters in strings', () => {
      db.open(':memory:');
      db.execute('CREATE TABLE strings (id INTEGER, text TEXT)');
      
      const specialString = "It's a test with 'quotes' and \"double quotes\"";
      db.execute('INSERT INTO strings (id, text) VALUES (?, ?)', 1, specialString);
      
      const result = db.queryOne('SELECT text FROM strings WHERE id = ?', 1);
      expect(result).toMatchObject({ text: specialString });
    });

    it('should handle large numbers', () => {
      db.open(':memory:');
      db.execute('CREATE TABLE numbers (id INTEGER, big_num INTEGER)');
      
      const bigNum = 9007199254740991; // Max safe integer
      db.execute('INSERT INTO numbers (id, big_num) VALUES (?, ?)', 1, bigNum);
      
      const result = db.queryOne('SELECT big_num FROM numbers WHERE id = ?', 1);
      expect(result).toMatchObject({ big_num: bigNum });
    });
  });
});
