import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.{js,ts}'],
        coverage: {
            provider: 'v8',
            include: ['middleware/**', 'routes/**', 'services/**'],
            reporter: ['text', 'html'],
        },
        // Prevent real env vars from leaking into tests
        env: {
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
            GEMINI_API_KEY: 'test-gemini-key',
            NODE_ENV: 'test',
        },
    },
});
