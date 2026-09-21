import { afterEach, describe, expect, it } from 'vitest';
import { getSafeTestMongoUri, validateTestMongoUri } from './db.js';

describe('test database URI safety', () => {
    const originalRemoteOptIn = process.env.ALLOW_REMOTE_TEST_DB;
    const originalTestUri = process.env.TEST_MONGODB_URI;
    const originalApplicationUri = process.env.MONGODB_URI;

    afterEach(() => {
        if (originalRemoteOptIn === undefined) delete process.env.ALLOW_REMOTE_TEST_DB;
        else process.env.ALLOW_REMOTE_TEST_DB = originalRemoteOptIn;
        if (originalTestUri === undefined) delete process.env.TEST_MONGODB_URI;
        else process.env.TEST_MONGODB_URI = originalTestUri;
        if (originalApplicationUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = originalApplicationUri;
    });

    it('accepts the local disposable database', () => {
        expect(validateTestMongoUri('mongodb://127.0.0.1:27017/motorx_test')).toContain('/motorx_test');
    });

    it('accepts the Docker disposable database host', () => {
        expect(validateTestMongoUri('mongodb://mongodb:27017/motorx_test?replicaSet=rs0')).toContain('/motorx_test');
    });

    it('rejects a non-test database before any connection is attempted', () => {
        expect(() => validateTestMongoUri('mongodb://127.0.0.1:27017/motorx')).toThrow(/Refusing to run destructive tests/);
    });

    it('rejects a remote Atlas host unless explicitly enabled', () => {
        expect(() => validateTestMongoUri('mongodb+srv://test.example.mongodb.net/motorx_test')).toThrow(/remote MongoDB host/);
    });

    it('allows an explicitly approved remote disposable test database', () => {
        expect(validateTestMongoUri('mongodb+srv://test.example.mongodb.net/motorx_test', true)).toContain('/motorx_test');
    });

    it('rejects unsupported URI schemes', () => {
        expect(() => validateTestMongoUri('https://localhost/motorx_test')).toThrow(/mongodb/);
    });

    it('requires TEST_MONGODB_URI and never falls back to MONGODB_URI', () => {
        delete process.env.TEST_MONGODB_URI;
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/motorx_test';
        expect(() => getSafeTestMongoUri()).toThrow(/TEST_MONGODB_URI is required/);
    });

    it('validates the configured test URI before returning it', () => {
        process.env.TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/motorx_test';
        expect(getSafeTestMongoUri()).toBe(process.env.TEST_MONGODB_URI);
    });
});
