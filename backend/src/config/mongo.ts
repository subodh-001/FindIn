import { MongoClient, Db, Collection, ServerApiVersion, Document, GridFSBucket } from 'mongodb';

let mongoClient: MongoClient | undefined;
let database: Db | undefined;
let gridFsBucket: GridFSBucket | undefined;

export async function connectToDatabase(uri: string) {
  if (database) {
    return database;
  }

  mongoClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: false,
    },
  });

  await mongoClient.connect();
  database = mongoClient.db('finding_her');
  gridFsBucket = new GridFSBucket(database, {
    bucketName: 'uploads',
  });

  process.on('SIGINT', async () => {
    await mongoClient?.close();
    process.exit(0);
  });

  return database;
}

export function getDb(): Db {
  if (!database) {
    throw new Error('Database has not been initialized. Call connectToDatabase first.');
  }

  return database;
}

export function getCollection<T extends Document = Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

export function getBucket(): GridFSBucket {
  if (!gridFsBucket) {
    throw new Error('GridFS bucket not initialized');
  }
  return gridFsBucket;
}

