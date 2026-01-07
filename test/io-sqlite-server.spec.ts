// @license
// Copyright (c) 2026 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { IoSqliteServer } from '../src/io-sqlite-server';

describe('IoSqlLiteServer', () => {
  let sVN: IoSqliteServer;

  beforeEach(() => {
    sVN = new IoSqliteServer();
  });

  afterEach(() => {
    // sVN.close();
  });

  describe('initialization', () => {
    it('should create a file-based database', () => {
      const fileDb = sVN.createDatabase();
      expect(fileDb).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should create a table', () => {
      sVN.execute('DROP TABLE IF EXISTS users');
      const result = sVN.execute(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
      );
      expect(result).toBeDefined();
    });

    it('should insert data', () => {
      const result = sVN.execute("INSERT INTO users (name) VALUES ('Alice')");
      expect(result).toBeDefined();
    });

    it('should select data', () => {
      const result = sVN.execute('SELECT * FROM users');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('should return something', async () => {
    await sVN.init();
    const result = sVN.execute('SELECT 1 as value');
    expect(result).toBeDefined();
  });
});
