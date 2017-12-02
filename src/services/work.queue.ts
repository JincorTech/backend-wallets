import * as Queue from 'bull';
import { Logger } from '../logger';
import config from '../config';

export class WorkQueue {
  private logger = Logger.getInstance('WORK_QUEUE');

  constructor(
    private queueName: string
  ) {
  }

  async publish(data: { id: string, data: any }) {
    this.logger.verbose('Publish', this.queueName, data.id);
    const concreatQueue = new Queue(this.queueName, config.redis.url);
    await concreatQueue.add(data);
    concreatQueue.count().then((cnt) => {
      this.logger.debug('Publish queue length', this.queueName, cnt);
      return concreatQueue.close();
    }, (err) => {
      this.logger.error('Error was occurred when publish', this.queueName, data.id, err);
      return concreatQueue.close();
    });
  }

  work(callback: (job: any, done: any) => Promise<any>) {
    this.logger.verbose('Work for', this.queueName);

    const concreatQueue = new Queue(this.queueName, config.redis.url);

    return concreatQueue.count().then((cnt) => {
      this.logger.debug('Queue length of', this.queueName, cnt);
      concreatQueue.process(async(job, done) => {
        await callback(job, done);
      });
    });
  }
}
