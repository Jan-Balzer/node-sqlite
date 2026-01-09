// @license
// Copyright (c) 2026 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { beforeEach, describe, expect, it } from 'vitest';

import { IoSqliteServer } from '../src/io-sqlite-server';

describe('IoSqlLiteServer', () => {
  let sVN: IoSqliteServer;
  beforeEach(async () => {
    sVN = new IoSqliteServer();
    await sVN.init();
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

  describe('database operations', () => {
    it('should handle multiple sequential queries', () => {
      sVN.execute('DROP TABLE IF EXISTS test');
      sVN.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      sVN.execute("INSERT INTO test (value) VALUES ('first')");
      sVN.execute("INSERT INTO test (value) VALUES ('second')");
      const result = sVN.execute('SELECT COUNT(*) as count FROM test');
      expect(result[0].count).toBe(2);
    });

    it('should return empty result for SELECT with no data', () => {
      sVN.execute('DROP TABLE IF EXISTS empty');
      sVN.execute('CREATE TABLE empty (id INTEGER PRIMARY KEY)');
      const result = sVN.execute('SELECT * FROM empty');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', () => {
      expect(() => sVN.execute('INVALID SQL QUERY')).toThrow();
    });

    it('should handle non-existent table errors', () => {
      expect(() => sVN.execute('SELECT * FROM nonexistent_table')).toThrow();
    });
  });
  describe('status properties', () => {
    describe('isOpen', () => {
      it('should return true when database is open', () => {
        sVN.init();
        expect(sVN.isOpen).toBe(true);
      });

      it('should return false when database is closed', () => {
        sVN.close();
        expect(sVN.isOpen).toBe(false);
      });
    });

    describe('isReady', () => {
      it('should return true when database is initialized', async () => {
        const result = sVN.isReady();
        expect(result).toBeInstanceOf(Promise);
      });
    });
  });

  describe('example usage', () => {
    it('should return an IoSqliteServer example', async () => {
      const example = await IoSqliteServer.example();
      expect(example).toBeDefined();
    });

    it('example instance should be operational', async () => {
      const example = await IoSqliteServer.example();
      const result = example.isOpen;
      expect(result).toBe(true);
    });
  });

  describe('return correct data', () => {
    it('should return a whole dump', async () => {
      await sVN.init();
      const dump = await sVN.dump();
      expect(dump).toBeDefined();
      expect(typeof dump).toBe('object');
    });
  });
});
