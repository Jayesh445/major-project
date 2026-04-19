"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const envFilePath = path_1.default.resolve(process.cwd(), '.env');
if (fs_1.default.existsSync(envFilePath)) {
    const contents = fs_1.default.readFileSync(envFilePath, 'utf-8');
    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().optional(),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().optional(),
    REFRESH_TOKEN_SECRET: zod_1.z.string().optional(),
    MAX_REFRESH_TOKENS: zod_1.z.string().optional(),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
}
exports.env = parsed.data;
