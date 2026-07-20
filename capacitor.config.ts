import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vocabularcoach.app',
  appName: 'Vocabular Coach',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
