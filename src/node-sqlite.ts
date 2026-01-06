// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { DatabaseSync } from 'node:sqlite';

/**
 * Options for opening a SQLite database
 */
export interface DatabaseOptions {
  /** Whether to open the database in read-only mode */
  readonly?: boolean;
  /** Whether to create the database if it doesn't exist */
  create?: boolean;
  /** Whether to open the database in memory */
  inMemory?: boolean;
}

/**
 * Result of a database query
 */
export interface QueryResult {
  /** Array of rows returned by the query */
  rows: unknown[];
  /** Number of changes made by the query */
  changes?: number;
  /** Last inserted row ID */
  lastInsertRowid?: number;
}

/**
 * A wrapper around Node.js native SQLite implementation
 */
export class NodeSQLite {
  private db: DatabaseSync | null = null;
  private dbPath: string | null = null;

  /**
   * Opens a SQLite database
   * @param path - Path to the database file, or ':memory:' for in-memory database
   * @param options - Database options
   * @returns The NodeSQLite instance for chaining
   */
  open(path: string, options: DatabaseOptions = {}): this {
    if (this.db) {
      throw new Error('Database is already open');
    }

    this.dbPath = path;
    
    // Use in-memory database if specified or path is ':memory:'
    if (options.inMemory || path === ':memory:') {
      this.db = new DatabaseSync(':memory:');
    } else {
      this.db = new DatabaseSync(path);
    }

    return this;
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (!this.db) {
      throw new Error('Database is not open');
    }
    this.db.close();
    this.db = null;
    this.dbPath = null;
  }

  /**
   * Executes a SQL statement without returning results
   * @param sql - SQL statement to execute
   * @param params - Parameters for the SQL statement
   * @returns Object with changes count and lastInsertRowid
   */
  execute(sql: string, ...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint } {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.run(...(params as never[]));
    
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    };
  }

  /**
   * Executes a SQL query and returns all results
   * @param sql - SQL query to execute
   * @param params - Parameters for the SQL query
   * @returns Array of result rows
   */
  query<T = unknown>(sql: string, ...params: unknown[]): T[] {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...(params as never[])) as T[];
  }

  /**
   * Executes a SQL query and returns the first result
   * @param sql - SQL query to execute
   * @param params - Parameters for the SQL query
   * @returns First result row or null if no results
   */
  queryOne<T = unknown>(sql: string, ...params: unknown[]): T | null {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...(params as never[]));
    return (result as T) || null;
  }

  /**
   * Prepares a SQL statement for later execution
   * @param sql - SQL statement to prepare
   * @returns Prepared statement object
   */
  prepare(sql: string) {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    return this.db.prepare(sql);
  }

  /**
   * Executes a function within a transaction
   * @param fn - Function to execute within the transaction
   * @returns Result of the function
   */
  transaction<T>(fn: () => T): T {
    if (!this.db) {
      throw new Error('Database is not open');
    }

    this.execute('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.execute('COMMIT');
      return result;
    } catch (error) {
      this.execute('ROLLBACK');
      throw error;
    }
  }

  /**
   * Checks if the database is currently open
   * @returns true if database is open, false otherwise
   */
  isOpen(): boolean {
    return this.db !== null;
  }

  /**
   * Gets the path of the currently open database
   * @returns Database path or null if not open
   */
  getPath(): string | null {
    return this.dbPath;
  }

  /**
   * Creates an in-memory SQLite database instance
   * @returns NodeSQLite instance with in-memory database
   */
  static inMemory(): NodeSQLite {
    const db = new NodeSQLite();
    db.open(':memory:', { inMemory: true });
    return db;
  }

  /**
   * Example instance for test purposes
   */
  static get example(): NodeSQLite {
    return NodeSQLite.inMemory();
  }
}
