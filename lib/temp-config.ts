// localStorage utility for temporary config storage when MongoDB is unavailable
export interface TempUserConfig {
  awsAccessKeyId: string
  awsSecretKey: string
  awsBucketName: string
  awsRegion: string
}

export class TempConfigService {
  private static readonly STORAGE_KEY = 's3manager_temp_config'

  static saveConfig(config: TempUserConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save config to localStorage:', error)
    }
  }

  static getConfig(): TempUserConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to get config from localStorage:', error)
      return null
    }
  }

  static deleteConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to delete config from localStorage:', error)
    }
  }

  static hasConfig(): boolean {
    return !!this.getConfig()
  }
}
