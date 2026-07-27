import { defineConfig } from '@quack/config/define';
import giphy from './plugins/giphy.ts';

export default defineConfig({
	port: 4001,
  databaseUrl: 'mongodb://chat:chat@mongo:27017/chat?authSource=admin',
	storage: {
		type: 'fs',
		directory: './uploads',
	},
  plugins: [
    giphy({
      giphyApiKey: 'secret-api-key',
    })
  ]
})
