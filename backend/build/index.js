"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = __importDefault(require("./routes/auth"));
const reports_1 = __importDefault(require("./routes/reports"));
const comments_1 = __importDefault(require("./routes/comments"));
const mongo_1 = require("./config/mongo");
const backgroundJobs_1 = require("./services/backgroundJobs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const corsOrigin = process.env.CORS_ORIGIN;
app.use((0, cors_1.default)({
    origin: corsOrigin ? corsOrigin.split(',') : '*',
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined'));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/comments', comments_1.default);
app.use((err, _req, res, _next) => {
    console.error('[server] unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
});
async function bootstrap() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }
        await (0, mongo_1.connectToDatabase)(uri);
        backgroundJobs_1.backgroundJobService.start();
        app.listen(port, () => {
            console.log(`[server] listening on http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('[server] failed to start', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map