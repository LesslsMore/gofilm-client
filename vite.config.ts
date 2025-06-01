import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";
import path from 'path';  // 引入 path 模块

export default defineConfig({
    // 本地测试环境
    server: {
        host: '0.0.0.0',
        port: 3606,
        proxy: {
            "/api": {
                // target: `http://127.0.0.1:3601`,
                target: `http://127.0.0.1:8000`,
                // target: `https://fjvtiyskqpsy.eu-central-1.clawcloudrun.com`,
                // target: `http://gofilm.ns-tpo0hbj4.svc.cluster.local:3601`,
                // target: `http://113.44.5.201:3601`,
                // target: 'https://gofilm-api.onrender.com',
                // target: 'https://gofilm-py.onrender.com/',
                // target: 'https://anime-danmu-api.vercel.app/',
                changeOrigin: true, // 允许跨域
                // rewrite: path => path.replace(/^\/api/, '')
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
