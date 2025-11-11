import { Db, Collection, Document } from 'mongodb';
export declare function connectToDatabase(uri: string): Promise<Db>;
export declare function getDb(): Db;
export declare function getCollection<T extends Document = Document>(name: string): Collection<T>;
//# sourceMappingURL=mongo.d.ts.map