import { describe, expect, it } from 'vitest';
import {
  extractFailedMigrationName,
  extractPrismaErrorCode,
  truncateCliOutput,
} from './migration-cli-parse';

describe('migration-cli-parse', () => {
  it('extracts Prisma error codes', () => {
    expect(extractPrismaErrorCode('Error: P3009\nmigrate found failed migrations')).toBe('P3009');
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

  it('parses P3018-style migration name line', () => {
    const output = `Error: P3018
Migration name: 20260624120000_ad_settings
Database error code: 1050`;
    expect(extractFailedMigrationName(output)).toBe('20260624120000_ad_settings');
  });

  it('truncates long CLI output for health payloads', () => {
    const long = 'x'.repeat(2500);
    expect(truncateCliOutput(long)).toHaveLength(2001);
    expect(truncateCliOutput(long).endsWith('…')).toBe(true);
  });
});
