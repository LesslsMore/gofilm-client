import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";
import path from 'path';  // 引入 path 模块
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
    // 本地测试环境
    server: {
        host: '0.0.0.0',
        port: 3600,
        proxy: {
            "/api": {
                // rewrite: path => path.replace(/^\/api/, ''),
                // target: `http://127.0.0.1:3601`,
                target: `http://127.0.0.1:8000`,
                // target: 'https://gofilm-api.onrender.com',
                // target: 'https://gofilm-py.onrender.com/',
                // target: 'https://anime-danmu-api.vercel.app/',
                changeOrigin: true, // 允许跨域
            },
            "/proxy": {
                target: `http://127.0.0.1:8000`,
                changeOrigin: true, // 允许跨域
                // rewrite: path => path.replace(/^\/api/, '')
            }
        },
    },

    // nginx发布构建时使用此配置
    // server: {
    //     host: 'localhost',
    //     port: 3600,
    //     proxy: {
    //         "/api": {
    //             target: `http://localhost`,
    //             changeOrigin: true, // 允许跨域
    //             rewrite: path => path.replace(/^\/api/,'')
    //         }
    //     },
    // },

    plugins: [
        vue(),
        VitePWA({
            registerType: 'prompt',
            injectRegister: false,

            pwaAssets: {
                disabled: false,
                config: true,
            },

            manifest: {
                name: '动漫弹幕播放',
                short_name: '动漫弹幕播放',
                description: '动漫弹幕播放',
                theme_color: '#ffffff',
            },

            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },

            devOptions: {
                enabled: true,
                navigateFallback: 'index.html',
                suppressWarnings: true,
                type: 'module',
            },
        }),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    css: {devSourcemap: true},
    build: {
        terserOptions: {
            compress: {
                drop_console:true,
                drop_debugger: true,
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')  // 关键配置
        }
    }
})
