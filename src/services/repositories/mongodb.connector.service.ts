import { MongoClient, Db } from 'mongodb';
import config from '../../config';
import { injectable } from 'inversify';

@injectable()
export class MongoDbConnector {
  private mongoDb: MongoClient;
  private db: Db;

  constructor(
    private connectionConfig: any = config.mongo
  ) {
  }

  async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await MongoClient.connect(this.connectionConfig.url, {
        autoReconnect: true
      }).then((db) => {
        return db;
      });
    }
    return this.db;
  }
}
