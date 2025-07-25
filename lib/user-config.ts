import clientPromise from './mongodb'

export interface UserConfig {
  userId: string
  awsAccessKeyId: string
  awsSecretKey: string
  awsBucketName: string
  awsRegion: string
  createdAt: Date
  updatedAt: Date
}

export class UserConfigService {
  private static collection = 'user_configs'

  static async saveUserConfig(config: Omit<UserConfig, 'createdAt' | 'updatedAt'>) {
    const client = await clientPromise
    const db = client.db('s3manager')
    
    const now = new Date()
    const userConfig: UserConfig = {
      ...config,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(this.collection).replaceOne(
      { userId: config.userId },
      userConfig,
      { upsert: true }
    )

    return result
  }

  static async getUserConfig(userId: string): Promise<UserConfig | null> {
    const client = await clientPromise
    const db = client.db('s3manager')
    
    const config = await db.collection(this.collection).findOne(
      { userId },
      { projection: { _id: 0 } }
    )

    return config as UserConfig | null
  }

  static async deleteUserConfig(userId: string) {
    const client = await clientPromise
    const db = client.db('s3manager')
    
    const result = await db.collection(this.collection).deleteOne({ userId })
    return result
  }

  static async hasUserConfig(userId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('s3manager')
    
    const count = await db.collection(this.collection).countDocuments({ userId })
    return count > 0
  }
}
