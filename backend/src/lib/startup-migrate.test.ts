import { describe, expect, it } from 'vitest';
import {
  extractFailedMigrationName,
  extractPrismaErrorCode,
  isAlreadyExistsError,
  truncateCliOutput,
} from './migration-cli-parse';
import { getRecoverableP3018Migration, INIT_MIGRATION_NAME } from './startup-migrate';

const INIT_P3018_OUTPUT = `Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20260101000000_init
Database error code: 1050
Database error:
Error code: Table 'Tamirli.User' already exists`;

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
  });

  it('detects already-exists / duplicate table errors', () => {
    expect(isAlreadyExistsError("Table 'Tamirli.User' already exists")).toBe(true);
    expect(isAlreadyExistsError('Database error code: 1050')).toBe(true);
    expect(isAlreadyExistsError(INIT_P3018_OUTPUT)).toBe(true);
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

  it('returns migration name when failedMigration is pre-parsed', () => {
    expect(
      getRecoverableP3018Migration({
        prismaCode: 'P3018',
        failedMigration: INIT_MIGRATION_NAME,
        cliOutput: "Table 'User' already exists",
      }),
    ).toBe(INIT_MIGRATION_NAME);
  });

  it('ignores P3018 when error is not already-exists', () => {
    expect(
      getRecoverableP3018Migration({
        prismaCode: 'P3018',
        cliOutput: `Error: P3018
Migration name: 20260509120000_admin_tool_config_user_blocked
Database error code: 1146
Table 'Tamirli.User' doesn't exist`,
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
