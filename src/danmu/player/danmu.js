import artplayerPluginDanmuku from 'artplayer-plugin-danmuku';
import {bilibiliDanmuParseFromJson} from "@/danmu/player/player.js";
import {get_comment, get_episodeId, get_search_episodes} from '@/danmu/api/api'
import {db_info, db_url, db_danmu} from "@/danmu/db/db.js";

const html_danmu = `<div id="k-player-danmaku-search-form">
                <label>
                  <span>搜索番剧名称</span>
                  <input type="text" id="animeName" class="k-input" />
                </label>
                <div style="min-height:24px; padding-top:4px">
                  <span id="tips"></span>
                </div>
                <label>
                  <span>番剧名称</span>
                  <select id="animes" class="k-select"></select>
                </label>
                <label>
                  <span>章节</span>
                  <select id="episodes" class="k-select"></select>
                </label>
                <label>
                  <span class="open-danmaku-list">
                    <span>弹幕列表</span><small id="count"></small>
                  </span>
                </label>
                
                <span class="specific-thanks">弹幕服务由 弹弹play 提供</span>
              </div>`

function art_msgs(art, msgs) {
    art.notice.show = msgs.join(',\n\n')
}

function update_danmu(art, danmus) {
    art.plugins.artplayerPluginDanmuku.config({
        danmuku: danmus,
    });
    art.plugins.artplayerPluginDanmuku.load();
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


function init(art, db_anime_info, db_anime_url, anime_id, episode) {
    add_danmu(art)

    let $count = document.querySelector("#count")
    let $animeName = document.querySelector("#animeName")
    let $animes = document.querySelector("#animes")
    let $episodes = document.querySelector("#episodes")

    let UNSEARCHED = ['未搜索到番剧弹幕', '请按右键菜单', '手动搜索番剧名称',]

    let SEARCHED = () => {
        try {
            return [`番剧：${$animes.options[$animes.selectedIndex].text}`, `章节: ${$episodes.options[$episodes.selectedIndex].text}`, `已加载 ${$count.textContent} 条弹幕`,]
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async function update_episode_danmu(anime_id, episode) {

        const new_idx = $episodes.selectedIndex
        const db_anime_info = await db_info.get(anime_id)
        const {episode_dif} = db_anime_info
        // 存储选择的剧集序号
        let dif = new_idx + 1 - episode
        if (dif !== episode_dif) {
            db_anime_info['episode_dif'] = dif
            // 更新选择的剧集
            db_info.put(anime_id, db_anime_info)
        }

        // 获取选中的值
        const episodeId = $episodes.value;
        // 在控制台打印选中的值
        console.log('episodeId: ', episodeId);

        let danmu
        try {
            // 优先使用接口数据
            danmu = await get_comment(episodeId)

            // 缓存新数据，有效期7天
            await db_danmu.put(anime_id, episodeId, danmu)
        } catch (error) {
            console.log('接口请求失败，尝试使用缓存数据')
            // 使用缓存数据
            danmu = await db_danmu.get(anime_id, episodeId)
            if (!danmu) {
                throw new Error('无法获取弹幕数据')
            }
        }

        let danmus = bilibiliDanmuParseFromJson(danmu)
        update_danmu(art, danmus)
    }

    function get_animes(art, db_anime_info) {
        const {animes, idx} = db_anime_info
        const {animeTitle} = animes[idx]
        if (!animes[idx].hasOwnProperty('animeId')) {
            console.log('没有缓存，请求接口')
            get_animes_new(animeTitle, art, db_anime_info)
        } else {
            console.log('有缓存，请求弹幕')
            updateAnimes(animes, idx)
        }
    }

// 请求接口，搜索番剧
    async function get_animes_new(title, art, db_anime_info) {
        try {
            const animes = await get_search_episodes(title)
            if (animes.length === 0) {
                art_msgs(art, UNSEARCHED)
            } else {
                db_anime_info['animes'] = animes
                // 更新搜索剧集
                db_info.put(anime_id, db_anime_info)
            }
            return animes
        } catch (error) {
            console.log('弹幕服务异常，稍后再试')
        }
    }


    // 初始番剧选项与默认选择
    function updateAnimes(animes, idx) {
        const html = animes.reduce((html, anime) => html + `<option value="${anime.animeId}">${anime.animeTitle}</option>`, '')
        $animes.innerHTML = html

        $animes.value = animes[idx]['animeId']

        const event = new Event('updateAnimes')
        event.value = animes[idx]
        console.log(animes[idx])
        document.dispatchEvent(event);
    }


// 更新 episode select
// 初始剧集选项与默认选择
    async function updateEpisodes(anime) {
        const {animeId, episodes} = anime
        const html = episodes.reduce((html, episode) => html + `<option value="${episode.episodeId}">${episode.episodeTitle}</option>`, '')
        $episodes.innerHTML = html

        const db_anime_info = await db_info.get(anime_id)
        const {episode_dif} = db_anime_info

        let episodeId = get_episodeId(animeId, episode_dif + episode)
        $episodes.value = episodeId

        const event = new Event('updateEpisodes');
        document.dispatchEvent(event);
    }

    // 监听加载到的弹幕数组
    art.on('artplayerPluginDanmuku:loaded', (danmus) => {
        console.info('加载弹幕', danmus.length);
        $count.textContent = danmus.length
        if ($count.textContent === '') {
            art_msgs(art, UNSEARCHED)
        } else {
            art_msgs(art, SEARCHED())
        }
    });

    art.on('pause', () => {
        if ($count.textContent === '') {
            art_msgs(art, UNSEARCHED)
        } else {
            art_msgs(art, SEARCHED())
        }
    });

    // 监听input元素的keypress事件
    $animeName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            get_animes_new($animeName.value, art, db_anime_info)
        }
    });
    // 监听input元素的blur事件
    $animeName.addEventListener('blur', () => {
        get_animes_new($animeName.value, art, db_anime_info)
    });
    // 初始搜索番剧默认名称
    $animeName.value = db_anime_info['animes'][db_anime_info['idx']]['animeTitle']

    $animes.addEventListener('change', async () => {
        // 获取选中的值
        const new_idx = $animes.selectedIndex
        const {idx, animes} = db_anime_info
        // 存储选择的番剧序号
        if (new_idx !== idx) {
            db_anime_info['idx'] = new_idx
            // 更新选择的剧集
            db_info.put(anime_id, db_anime_info)
            // 番剧选项变化
            updateEpisodes(animes[new_idx])

            // $animeName.value = anime_info['animes'][anime_info['idx']]['animeTitle']
        }
    });

    // 监听input元素的keypress事件
    $episodes.addEventListener('change', function (e) {
        console.log('updateEpisodes 事件')
        update_episode_danmu(anime_id, episode)
    });

    document.addEventListener('db_info_put', async function (e) {
        let {animes: old_animes} = await db_info.get(anime_id)
        let {animes: new_animes, idx: new_idx} = e.value
        if (new_animes !== old_animes) {
            // 初始番剧选项与默认选择
            updateAnimes(new_animes, new_idx)
        }
    });

    document.addEventListener('updateAnimes', function (e) {
        console.log('updateAnimes 事件')
        updateEpisodes(e.value)
    });

    document.addEventListener('updateEpisodes', function (e) {
        console.log('updateEpisodes 事件')
        update_episode_danmu(anime_id, episode)
    });

    get_animes(art, db_anime_info)
}



export {
    update_danmu,
    add_danmu,
    init,
    html_danmu,
}
