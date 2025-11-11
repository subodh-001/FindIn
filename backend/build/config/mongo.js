"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDb = getDb;
exports.getCollection = getCollection;
const mongodb_1 = require("mongodb");
let mongoClient;
let database;
async function connectToDatabase(uri) {
    if (database) {
        return database;
    }
    mongoClient = new mongodb_1.MongoClient(uri, {
        serverApi: {
            version: mongodb_1.ServerApiVersion.v1,
            strict: false,
            deprecationErrors: false,
        },
    });
    await mongoClient.connect();
    database = mongoClient.db('finding_her');
    process.on('SIGINT', async () => {
        await mongoClient?.close();
        process.exit(0);
    });
    return database;
}
function getDb() {
    if (!database) {
        throw new Error('Database has not been initialized. Call connectToDatabase first.');
    }
    return database;
}
function getCollection(name) {
    return getDb().collection(name);
}
//# sourceMappingURL=mongo.js.map