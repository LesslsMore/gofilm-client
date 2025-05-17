import Artplayer from 'artplayer';
import Hls from 'hls.js';
import saveAs from 'file-saver'
import {html_danmu} from "@/danmu/player/danmu.js";
import posterImg from '@/assets/image/play.png'

function playM3u8(video, url, art) {
    if (Hls.isSupported()) {
        if (art.hls) art.hls.destroy();
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        art.hls = hls;
        art.on('destroy', () => hls.destroy());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    } else {
        art.notice.show = 'Unsupported playback format: m3u8';
    }
}

// 加载 url danmu 播放器
function new_danmu_player(url, container, data) {
    var art = new Artplayer({
        container,
        url,
        type: 'm3u8',
        customType: {
            m3u8: playM3u8,
          },
        volume: data.options.volume,
        // autoplay: data.autoplay,
        poster: posterImg,
        // autoplay: true,
        // muted: true,
        autoSize: true,
        fullscreen: true,
        fullscreenWeb: true,
        autoOrientation: true,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        setting: true,
        controls: [
            {
                position: 'right',
                html: '上传',
                click: function () {
                    const input = document.createElement("input");
                    input.type = "file";
                    // input.accept = "text/xml";
                    input.accept = ".json, .xml"; // 支持上传 JSON 和 XML 文件
                    input.addEventListener("change", () => {
                        const file = input.files[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = () => {
                            const content = reader.result;

                            // 根据文件后缀名区分处理逻辑
                            if (file.name.endsWith(".json")) {
                                // 解析 JSON 格式弹幕
                                let json = JSON.parse(content)
                                let comments
                                if (json.length === 1) {
                                    comments = json[0].comments;
                                } else {
                                    comments = json
                                }
                                const dm = bilibiliDanmuParseFromJson(comments);
                                console.log("Parsed JSON danmaku:", dm);
                                art.plugins.artplayerPluginDanmuku.config({
                                    danmuku: dm,
                                });
                                art.plugins.artplayerPluginDanmuku.load();
                            } else if (file.name.endsWith(".xml")) {
                                // 解析 XML 格式弹幕
                                const dm = bilibiliDanmuParseFromXml(content);
                                console.log("Parsed XML danmaku:", dm);
                                art.plugins.artplayerPluginDanmuku.config({
                                    danmuku: dm,
                                });
                                art.plugins.artplayerPluginDanmuku.load();
                            } else {
                                console.error("Unsupported file format. Please upload a .json or .xml file.");
                            }
                        };
                        reader.readAsText(file);
                    });
                    input.click();
                },
            },
            {
                position: 'right',
                html: '下载',
                click: async function () {
                    let $episodes = document.querySelector("#episodes")
                    const episodeId = $episodes.value
                    // let {anime_id, episode, title, url} = info
                    // // let danmu = await db_danmu.get(anime_id, episodeId)
                    let info = art.storage.get('info')
                    const {title, episode} = info
                    let danmu = art.storage.get(episodeId)

                    const blob = new Blob([JSON.stringify(danmu)], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, `${title} - ${episode}.json`);
                },
            },
        ],
        contextmenu: [
            {
                name: '搜索',
                html: html_danmu,
            },
        ],
    });
    return art
}

function getMode(key) {
    switch (key) {
        case 1:
        case 2:
        case 3:
            return 0;
        case 4:
        case 5:
            return 1;
        default:
            return 0;
    }
}

// 将 danmu xml 字符串转为 bilibili 格式
function bilibiliDanmuParseFromXml(xmlString) {
    if (typeof xmlString !== 'string') return [];
    const matches = xmlString.matchAll(/<d (?:.*? )??p="(?<p>.+?)"(?: .*?)?>(?<text>.+?)<\/d>/gs);
    return Array.from(matches)
        .map((match) => {
            const attr = match.groups.p.split(',');
            if (attr.length >= 8) {
                const text = match.groups.text
                    .trim()
                    .replaceAll('&quot;', '"')
                    .replaceAll('&apos;', "'")
                    .replaceAll('&lt;', '<')
                    .replaceAll('&gt;', '>')
                    .replaceAll('&amp;', '&');

                return {
                    text,
                    time: Number(attr[0]),
                    mode: getMode(Number(attr[1])),
                    fontSize: Number(attr[2]),
                    color: `#${Number(attr[3]).toString(16)}`,
                    timestamp: Number(attr[4]),
                    pool: Number(attr[5]),
                    userID: attr[6],
                    rowID: Number(attr[7]),
                };
            } else {
                return null;
            }
        })
        .filter(Boolean);
}

// 将 danmu json 转为 bilibili 格式
function bilibiliDanmuParseFromJson(jsonString) {
    return jsonString.map((comment) => {
        let attr = comment.p.split(',');
        return {
            text: comment.m,
            time: Number(attr[0]),
            mode: getMode(Number(attr[1])),
            fontSize: Number(25),
            color: `#${Number(attr[2]).toString(16)}`,
            timestamp: Number(comment.cid),
            pool: Number(0),
            userID: attr[3],
            rowID: Number(0),
        }
    })
}

export { new_danmu_player, bilibiliDanmuParseFromJson};
