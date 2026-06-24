import { describe, expect, it, vi } from 'vitest';

import {

  extractFailedMigrationName,

  extractPrismaErrorCode,

  isAlreadyExistsError,

  truncateCliOutput,

} from './migration-cli-parse';

import {

  getP3009ResolveAction,

  getRecoverableP3018Migration,

  INIT_MIGRATION_NAME,

  runMigrateWithRetry,

} from './startup-migrate';



const INIT_P3018_OUTPUT = `Error: P3018

A migration failed to apply. New migrations cannot be applied before the error is recovered from.

Migration name: 20260101000000_init

Database error code: 1050

Database error:

Error code: Table 'Tamirli.User' already exists`;



/** Exact /health migrations.error tail from tamir.li prod (2026-06-23). */

const PROD_P3018_OUTPUT = `Prisma schema loaded from backend/prisma/schema.prisma

Datasource "db": MySQL database "Tamirli" at "localhost:3306"



5 migrations found in prisma/migrations



Applying migration \`20260101000000_init\`



Error: P3018



A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve



Migration name: 20260101000000_init



Database error code: 1050



Database error:

Table 'User' already exists



Please check the query number 1 from the migration file.`;



describe('migration-cli-parse', () => {

  it('extracts Prisma error codes', () => {

    expect(extractPrismaErrorCode('Error: P3009\nmigrate found failed migrations')).toBe('P3009');

    expect(extractPrismaErrorCode('Error: P3018\nMigration failed')).toBe('P3018');

    expect(extractPrismaErrorCode('no code here')).toBeUndefined();

  });



  it('parses P3009 migration name with "migration failed" wording', () => {

    const output = `Error: P3009

migrate found failed migrations in the target database, new migrations will not be applied.

The \`20260624120000_ad_settings\` migration failed.`;



    expect(extractFailedMigrationName(output)).toBe('20260624120000_ad_settings');

  });



  it('parses P3009 migration name with direct "failed" wording', () => {

    const output = 'The `20260624133000_ad_settings_updated_at_default` failed at 2026-06-24';

    expect(extractFailedMigrationName(output)).toBe('20260624133000_ad_settings_updated_at_default');

  });



  it('parses P3018 migration name line', () => {

    const output = `Error: P3018

Migration name: 20260624120000_ad_settings

Database error code: 1050`;

    expect(extractFailedMigrationName(output)).toBe('20260624120000_ad_settings');

  });



  it('parses P3018 init migration name when User table already exists', () => {

    expect(extractFailedMigrationName(INIT_P3018_OUTPUT)).toBe('20260101000000_init');

    expect(extractFailedMigrationName(PROD_P3018_OUTPUT)).toBe('20260101000000_init');

  });



  it('detects already-exists / duplicate table errors', () => {

    expect(isAlreadyExistsError("Table 'Tamirli.User' already exists")).toBe(true);

    expect(isAlreadyExistsError('Database error code: 1050')).toBe(true);

    expect(isAlreadyExistsError(INIT_P3018_OUTPUT)).toBe(true);

    expect(isAlreadyExistsError(PROD_P3018_OUTPUT)).toBe(true);

    expect(isAlreadyExistsError('Table User does not exist')).toBe(false);

  });



  it('truncates long CLI output for health payloads', () => {

    const long = 'x'.repeat(2500);

    expect(truncateCliOutput(long)).toHaveLength(2001);

    expect(truncateCliOutput(long).endsWith('…')).toBe(true);

  });

});



describe('startup-migrate P3018 recovery', () => {

  it('returns init migration name for P3018 with User already exists', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3018',

        cliOutput: INIT_P3018_OUTPUT,

      }),

    ).toBe(INIT_MIGRATION_NAME);

  });



  it('returns init migration name for prod /health CLI output', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3018',

        cliOutput: PROD_P3018_OUTPUT,

      }),

    ).toBe(INIT_MIGRATION_NAME);

  });



  it('returns migration name when failedMigration is pre-parsed', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3018',

        failedMigration: INIT_MIGRATION_NAME,

        cliOutput: "Table 'User' already exists",

      }),

    ).toBe(INIT_MIGRATION_NAME);

  });



  it('returns migration name for P3018 even without already-exists hint when name is known', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3018',

        failedMigration: INIT_MIGRATION_NAME,

        cliOutput: 'Error: P3018\nMigration name: 20260101000000_init',

      }),

    ).toBe(INIT_MIGRATION_NAME);

  });



  it('ignores P3018 when migration name cannot be parsed', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3018',

        cliOutput: 'Error: P3018\nno migration name here',

      }),

    ).toBeUndefined();

  });



  it('ignores non-P3018 codes', () => {

    expect(

      getRecoverableP3018Migration({

        prismaCode: 'P3009',

        cliOutput: INIT_P3018_OUTPUT,

      }),

    ).toBeUndefined();

  });

});



describe('startup-migrate P3009 init recovery', () => {

  it('uses applied for init when User already exists', () => {

    expect(getP3009ResolveAction(INIT_MIGRATION_NAME, PROD_P3018_OUTPUT)).toBe('applied');

  });



  it('uses rolled-back for non-init migrations', () => {

    expect(getP3009ResolveAction('20260624120000_ad_settings', PROD_P3018_OUTPUT)).toBe(

      'rolled-back',

    );

  });

});



describe('startup-migrate integration (mocked CLI)', () => {

  it('resolves P3018 init as applied then completes deploy', () => {

    const deployOutputs = [

      { status: 1, stdout: PROD_P3018_OUTPUT, stderr: '' },

      { status: 0, stdout: 'All migrations have been successfully applied.', stderr: '' },

    ];

    let deployCalls = 0;



    const spawnSyncFn = vi.fn((_cmd: string, args: string[]) => {

      const joined = args.join(' ');

      if (joined.includes('migrate resolve') && joined.includes('--applied')) {

        expect(joined).toContain(INIT_MIGRATION_NAME);

        return { status: 0, stdout: '', stderr: '' };

      }

      if (joined.includes('migrate deploy')) {

        const out = deployOutputs[deployCalls] ?? deployOutputs[deployOutputs.length - 1];

        deployCalls += 1;

        return out;

      }

      return { status: 1, stdout: 'unexpected command', stderr: '' };

    });



    const invoke = { command: process.execPath, args: ['/fake/prisma.js'] };

    const result = runMigrateWithRetry('/deploy', '/deploy/backend/prisma/schema.prisma', invoke, spawnSyncFn);



    expect(result.ok).toBe(true);

    expect(deployCalls).toBe(2);

    expect(spawnSyncFn).toHaveBeenCalledWith(

      process.execPath,

      expect.arrayContaining(['migrate', 'resolve', '--applied', INIT_MIGRATION_NAME]),

      expect.any(Object),

    );

  });



  it('retries up to 3 cycles when resolve keeps failing', () => {

    const spawnSyncFn = vi.fn((_cmd: string, args: string[]) => {

      const joined = args.join(' ');

      if (joined.includes('migrate resolve')) {

        return { status: 1, stdout: 'Error: P3012\nResolve failed', stderr: '' };

      }

      return { status: 1, stdout: PROD_P3018_OUTPUT, stderr: '' };

    });



    const invoke = { command: process.execPath, args: ['/fake/prisma.js'] };

    const result = runMigrateWithRetry('/deploy', '/deploy/backend/prisma/schema.prisma', invoke, spawnSyncFn);



    expect(result.ok).toBe(false);

    if (!result.ok) {

      expect(result.error).toContain('Resolve failed');

    }

    expect(
      spawnSyncFn.mock.calls.filter((c) => (c[1] as string[]).join(' ').includes('migrate deploy'))
        .length,
    ).toBe(3);

  });

});


