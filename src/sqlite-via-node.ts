// @license
// Copyright (c) 2026 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class SqliteViaNode {
  /** Example instance for test purposes */
  static get example(): SqliteViaNode {
    return new SqliteViaNode();
  }

  public createDatabase(): string {
    const dbFile = './data/app.db';
    mkdirSync(dirname(dbFile), { recursive: true });
    const database = new DatabaseSync(dbFile);
    console.log('Database created at', dbFile);
    database.close();
    return dbFile;
  }

  public queryDatabase(): Array<{ id: number; name: string }> {
    const dbFile = './data/app.db';
    const database = new DatabaseSync(dbFile);
    const rows = database.prepare('SELECT id, name FROM example;').all();
    return rows as Array<{ id: number; name: string }>;
  }

  public execute(sql: string): any {
    const dbFile = './data/app.db';
    const database = new DatabaseSync(dbFile);
    const stmt = database.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all();
    } else {
      return stmt.run();
    }
  }
}
