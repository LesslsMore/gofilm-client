import artplayerPluginDanmuku from 'artplayer-plugin-danmuku';
import {bilibiliDanmuParseFromJson} from "@/danmu/player/player.js";
import {get_comment, get_episodeId, get_search_episodes} from '@/danmu/api/api'
import {db_info} from "@/danmu/db/db.js";

const html_danmu = `<div id="k-player-danmaku-search-form">
                <label>
                  <span>搜索番剧名称</span>
                  <input type="text" id="anime_name" class="k-input" />
                </label>
                <div style="min-height:24px; padding-top:4px">
                  <span id="tips"></span>
                </div>
                <label>
                  <span>番剧名称</span>
                  <select id="anime_list" class="k-select"></select>
                </label>
                <label>
                  <span>章节</span>
                  <select id="episode_list" class="k-select"></select>
                </label>
                <label>
                  <span class="open-danmaku-list">
                    <span>弹幕列表</span>
                    <small id="danmu_count"></small>
                  </span>
                </label>
                
                <span class="specific-thanks">弹幕服务由 弹弹play 提供</span>
              </div>`

function art_msgs(art, msgs) {
    art.notice.show = msgs.join(',\n\n')
}

function update_danmu(art, danmu) {
    let danmus = bilibiliDanmuParseFromJson(danmu)
    art.plugins.artplayerPluginDanmuku.config({
        danmuku: danmus,
    });
    art.plugins.artplayerPluginDanmuku.load();
}

// 加载 url danmu 播放器
function upload_danmu(art) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, .xml"; // 支持上传 JSON 和 XML 文件
    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const content = reader.result;
            // 根据文件后缀名区分处理逻辑
            if (file.name.endsWith(".json")) {
                let json = JSON.parse(content);
                let comments;
                if (json.length === 1) {
                    comments = json[0].comments;
                } else {
                    comments = json;
                }
                const dm = bilibiliDanmuParseFromJson(comments);
                console.log("Parsed JSON danmaku:", dm);
                art.plugins.artplayerPluginDanmuku.config({
                    danmuku: dm,
                });
                art.plugins.artplayerPluginDanmuku.load();
            } else if (file.name.endsWith(".xml")) {
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
}

async function down_danmu(art) {
    let $episode_list = document.querySelector("#episode_list")
    const episodeId = $episode_list.value
    // let {anime_id, episode, title, url} = info
    // // let danmu = await db_danmu.get(anime_id, episodeId)
    let danmu = art.storage.get(episodeId)

    let info = art.storage.get('info')
    const {title, episode} = info
    const blob = new Blob([JSON.stringify(danmu)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, `${title} - ${episode}.json`);
}

function add_danmu(art) {
    let plug = artplayerPluginDanmuku({
        danmuku: [],
        speed: 5, // 弹幕持续时间，单位秒，范围在[1 ~ 10]
        opacity: 1, // 弹幕透明度，范围在[0 ~ 1]
        fontSize: 25, // 字体大小，支持数字和百分比
        color: '#FFFFFF', // 默认字体颜色
        mode: 0, // 默认模式，0-滚动，1-静止
        margin: [10, '25%'], // 弹幕上下边距，支持数字和百分比
        antiOverlap: true, // 是否防重叠
        useWorker: true, // 是否使用 web worker
        synchronousPlayback: false, // 是否同步到播放速度
        filter: (danmu) => danmu.text.length < 50, // 弹幕过滤函数，返回 true 则可以发送
        lockTime: 5, // 输入框锁定时间，单位秒，范围在[1 ~ 60]
        maxLength: 100, // 输入框最大可输入的字数，范围在[0 ~ 500]
        minWidth: 200, // 输入框最小宽度，范围在[0 ~ 500]，填 0 则为无限制
        maxWidth: 600, // 输入框最大宽度，范围在[0 ~ Infinity]，填 0 则为 100% 宽度
        theme: 'light', // 输入框自定义挂载时的主题色，默认为 dark，可以选填亮色 light
        heatmap: true, // 是否开启弹幕热度图, 默认为 false
        beforeEmit: (danmu) => !!danmu.text.trim(), // 发送弹幕前的自定义校验，返回 true 则可以发送

        // 通过 mount 选项可以自定义输入框挂载的位置，默认挂载于播放器底部，仅在当宽度小于最小值时生效
        // mount: document.querySelector('.artplayer-danmuku'),
    })

    art.plugins.add(plug);

    // 监听手动输入的弹幕，保存到数据库
    art.on('artplayerPluginDanmuku:emit', (danmu) => {
        console.info('新增弹幕', danmu);
    });

    // 监听加载到弹幕的错误
    art.on('artplayerPluginDanmuku:error', (error) => {
        console.info('加载错误', error);
    });

    // 监听弹幕配置变化
    art.on('artplayerPluginDanmuku:config', (option) => {
        // console.info('配置变化', option);
    });

    // // 监听弹幕停止
    // art.on('artplayerPluginDanmuku:stop', () => {
    //     console.info('弹幕停止');
    // });
    //
    // // 监听弹幕开始
    // art.on('artplayerPluginDanmuku:start', () => {
    //     console.info('弹幕开始');
    // });
    //
    // // 监听弹幕隐藏
    // art.on('artplayerPluginDanmuku:hide', () => {
    //     console.info('弹幕隐藏');
    // });
    //
    // // 监听弹幕显示
    // art.on('artplayerPluginDanmuku:show', () => {
    //     console.info('弹幕显示');
    // });
    //
    // // 监听弹幕销毁
    // art.on('artplayerPluginDanmuku:destroy', () => {
    //     console.info('弹幕销毁');
    // });
}

let UNSEARCHED = ['未搜索到番剧弹幕', '请按右键菜单', '手动搜索番剧名称',]


function init_player(art) {
    add_danmu(art)

    let $danmu_count = document.querySelector("#danmu_count")

    let $anime_list = document.querySelector("#anime_list")
    let $episode_list = document.querySelector("#episode_list")


    let SEARCHED = () => {
        try {
            return [`番剧：${$anime_list.options[$anime_list.selectedIndex].text}`, `章节: ${$episode_list.options[$episode_list.selectedIndex].text}`, `已加载 ${$danmu_count.textContent} 条弹幕`,]
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async function update_episode_select(art) {
        // 章节
        let {
            anime_id,
            title,

            url,
            episode,
        } = art.storage.get('info')

        let $episodes = document.querySelector("#episode_list")

        const episode_idx = $episodes.selectedIndex
        console.log('update_episode_select: ', episode_idx)
        let db_anime_info = await db_info.get(anime_id)
        // let db_anime_info = art.storage.get('db_info')
        const {episode_dif} = db_anime_info
        // 存储选择的剧集序号
        let dif = episode_idx + 1 - episode
        if (dif !== episode_dif) {
            db_anime_info['episode_dif'] = dif
            await db_info.put(anime_id, db_anime_info)
            // 更新选择的剧集
            // const event = new Event('db_info_put');
            // event.key = anime_id;
            // event.value = db_anime_info;
            // document.dispatchEvent(event);
            //
            // let db_info = art.storage.get('db_info')
            // let {animes: old_animes} = db_info
            // let {animes: new_animes, idx: new_idx} = e.value
            // if (new_animes !== old_animes) {
            //     // 初始番剧选项与默认选择
            //     db_info.animes = new_animes
            //     db_info.idx = new_idx
            //     art.storage.set('db_info', db_info)
            // }
        }

        // 获取选中的值
        const episodeId = $episodes.value;
        // 在控制台打印选中的值
        let danmu
        try {
            // 优先使用接口数据
            danmu = await get_comment(episodeId)
            art.storage.set(episodeId, danmu)
        } catch (error) {
            console.log('接口请求失败，尝试使用缓存数据: ', error)
            danmu = art.storage.get(episodeId)
            if (!danmu) {
                throw new Error('无法获取弹幕数据')
            }
        }
        update_danmu(art, danmu)
    }


// 更新 episode select
// 初始剧集选项与默认选择
    async function update_episode_list(art, anime) {
        console.log('update_episode_list: ', anime)

        let {
            anime_id,
            title,

            url,
            episode,
        } = art.storage.get('info')
        // 章节
        let $episodes = document.querySelector("#episode_list")

        const {animeId, episodes} = anime
        const html = episodes.reduce((html, episode) => html + `<option value="${episode.episodeId}">${episode.episodeTitle}</option>`, '')
        $episodes.innerHTML = html

        let db_anime_info = await db_info.get(anime_id)
        // let db_anime_info = art.storage.get('db_info')
        const {episode_dif} = db_anime_info

        let episodeId = get_episodeId(animeId, episode_dif + episode)

        $episodes.value = episodeId

        const event = new CustomEvent('update_episode_select', {
            detail: {
                art,
            },
        });
        document.dispatchEvent(event);
    }

    // 监听加载到的弹幕数组
    art.on('artplayerPluginDanmuku:loaded', (danmus) => {
        console.info('加载弹幕', danmus.length);
        $danmu_count.textContent = danmus.length
        if ($danmu_count.textContent === '') {
            art_msgs(art, UNSEARCHED)
        } else {
            art_msgs(art, SEARCHED())
        }
    });

    art.on('pause', () => {
        if ($danmu_count.textContent === '') {
            art_msgs(art, UNSEARCHED)
        } else {
            art_msgs(art, SEARCHED())
        }
    });



    $anime_list.addEventListener('change', async () => {
        // let db_anime_info = art.storage.get('db_info')
        let {
            anime_id,
            title,

            url,
            episode,
        } = art.storage.get('info')
        let db_anime_info = await db_info.get(anime_id)
        // 获取选中的值
        const new_idx = $anime_list.selectedIndex
        const {anime_idx, animes} = db_anime_info
        // 存储选择的番剧序号
        if (new_idx !== anime_idx) {
            db_anime_info['anime_idx'] = new_idx
            // 更新选择的剧集
            // art.storage.set('db_info', db_anime_info)
            await db_info.put(anime_id, db_anime_info)
            await set_anime_name(art)

            // 番剧选项变化
            await update_episode_list(art, animes[new_idx])

            // $animeName.value = anime_info['animes'][anime_info['idx']]['animeTitle']
        }
    });

    // 监听input元素的keypress事件
    $episode_list.addEventListener('change', async function (e) {
        await update_episode_select(art)
    });

    // document.addEventListener('db_info_put', async function (e) {
    //     let {
    //         anime_id,
    //         title,
    //
    //         url,
    //         episode,
    //     } = art.storage.get('info')
    //     let db_anime_info = await db_info.get(anime_id)
    //     let {animes: old_animes} = db_anime_info
    //     // let db_info = art.storage.get('db_info')
    //     // let {animes: old_animes} = db_info
    //     let {animes: new_animes, idx: new_idx} = e.value
    //     if (new_animes !== old_animes) {
    //         // 初始番剧选项与默认选择
    //         db_anime_info.animes = new_animes
    //         db_anime_info.idx = new_idx
    //         // art.storage.set('db_info', db_anime_info)
    //         await db_info.put(anime_id, db_anime_info)
    //         update_animes_list(art, new_animes, new_idx)
    //     }
    // });

    document.addEventListener('update_episode_list', async function (e) {
        let {art, anime} = e.detail
        await update_episode_list(art, anime)
    });

    document.addEventListener('update_episode_select', async function (e) {
        let {art} = e.detail
        await update_episode_select(art)
    });

    let $animeName = document.querySelector("#anime_name")
// 监听input元素的keypress事件
    $animeName.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await update_anime_list_req($animeName.value, art)
        }
    });
// 监听input元素的blur事件
    $animeName.addEventListener('blur', async () => {
        await update_anime_list_req($animeName.value, art)
    });

    return {
        $animeName,
        $count: $danmu_count,
        $animes: $anime_list,
        $episodes: $episode_list,
    }
}

async function set_anime_name(art) {

    let {
        anime_id,
        title,

        url,
        episode,
    } = art.storage.get('info')

    let db_anime_info = await db_info.get(anime_id)
    console.log(db_anime_info)
    let {animes, anime_idx} = db_anime_info
    let animeTitle = animes[anime_idx].animeTitle
    let $animeName = document.querySelector("#anime_name")
    // 初始搜索番剧默认名称
    console.log('set_anime_name: ', animeTitle, title)
    if (animeTitle) {
        $animeName.value = animeTitle
    } else {
        $animeName.value = title
    }
}


// 请求接口，搜索番剧
async function update_anime_list_req(animeTitle, art) {
    let {
        anime_id,
        title,

        url,
        episode,
    } = art.storage.get('info')

    let db_anime_info = await db_info.get(anime_id)
    // let db_anime_info = art.storage.get('db_info')
    try {
        const animes = await get_search_episodes(animeTitle)
        if (animes.length === 0) {
            art_msgs(art, UNSEARCHED)
        } else {
            db_anime_info['animes'] = animes
            await db_info.put(anime_id, db_anime_info)
            // art.storage.set('db_info', db_anime_info)
            await set_anime_name(art)

            update_anime_list_dom(art, animes, db_anime_info.anime_idx)
        }
        return animes
    } catch (error) {
        console.log('弹幕服务异常，稍后再试: ', error)
    }
}

// 初始番剧选项与默认选择
function update_anime_list_dom(art, animes, anime_idx) {
    console.log('update_anime_list: ', animes, anime_idx)
    // 番剧名称列表
    let $anime_list = document.querySelector("#anime_list")

    const html = animes.reduce((html, anime) => html + `<option value="${anime.animeId}">${anime.animeTitle}</option>`, '')
    $anime_list.innerHTML = html

    let anime = animes[anime_idx]
    $anime_list.value = anime['animeId']

    // const event = new Event('update_episodes')
    // event.value = animes[idx]
    // console.log(animes[idx])

    const event = new CustomEvent('update_episode_list', {
        detail: {
            art,
            anime,
        },
    });
    document.dispatchEvent(event);
}

async function get_anime_list(art) {
    let {
        anime_id,
        title,

        url,
        episode,
    } = art.storage.get('info')

    let db_anime_info = await db_info.get(anime_id)
    // let db_anime_info = art.storage.get('db_info')

    let {animes, anime_idx} = db_anime_info
    let anime = animes[anime_idx]
    const {animeTitle} = anime
    if (!anime.hasOwnProperty('animeId')) {
        console.log('没有缓存，请求接口')
        await update_anime_list_req(animeTitle, art)
    } else {
        console.log('有缓存，请求弹幕')
        update_anime_list_dom(art, animes, anime_idx)
    }
}


export {
    update_danmu,
    add_danmu,
    init_player,
    html_danmu,
    get_anime_list,
    set_anime_name,
    upload_danmu,
    down_danmu,
}
