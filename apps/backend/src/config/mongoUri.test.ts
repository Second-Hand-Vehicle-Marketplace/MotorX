import { describe, expect, it } from 'vitest';
import { findProductionMongoUriProblems } from '@motorx/shared-contracts';

describe('findProductionMongoUriProblems', () => {
  it('accepts an Atlas SRV URI naming the production database', () => {
    expect(findProductionMongoUriProblems('mongodb+srv://app:secret@prod.abc.mongodb.net/motorx?retryWrites=true&w=majority')).toEqual([]);
  });

  it('accepts a standard URI with TLS enabled', () => {
    expect(findProductionMongoUriProblems('mongodb://app:secret@a.example.net:27017,b.example.net:27017/motorx?tls=true&replicaSet=rs0')).toEqual([]);
  });

  it('rejects unencrypted and local connections', () => {
    const problems = findProductionMongoUriProblems('mongodb://localhost:27017/motorx');
    expect(problems.some((problem) => problem.includes('TLS'))).toBe(true);
    expect(problems.some((problem) => problem.includes('local database host'))).toBe(true);
  });

  it('rejects SRV URIs that explicitly disable TLS', () => {
    expect(findProductionMongoUriProblems('mongodb+srv://app:secret@prod.abc.mongodb.net/motorx?tls=false')).toHaveLength(1);
  });

  it.each(['motorx_test', 'motorx-dev', 'motorx_development', 'local'])('rejects the non-production database %s', (database) => {
    expect(findProductionMongoUriProblems(`mongodb+srv://app:secret@prod.abc.mongodb.net/${database}`)).toHaveLength(1);
  });

  it('requires an explicit database name', () => {
    expect(findProductionMongoUriProblems('mongodb+srv://app:secret@prod.abc.mongodb.net/?appName=MotorX')).toHaveLength(1);
  });

  it('rejects strings that are not MongoDB URIs', () => {
    expect(findProductionMongoUriProblems('postgres://db/motorx')).toHaveLength(1);
  });
});
