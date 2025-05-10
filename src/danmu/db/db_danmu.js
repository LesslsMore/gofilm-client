import {db_info, db_url} from "@/danmu/db/db.js";

// import {get_yhdmjx_url} from '@/parser/get_yhdmjx_url.js'

async function save_anime_info_db(anime_id, title, url) {
    let db_anime_url = {
        "episodes": {},
    }
    let db_url_value = await db_url.get(anime_id)

    if (db_url_value != null) {
        db_anime_url = db_url_value
    }

    let src_url
    if (!db_anime_url['episodes'].hasOwnProperty(url)) {
        // let { mp4, m3u8 } = await get_yhdmjx_url(url)
        // src_url = mp4
        // // src_url = m3u8
        src_url = url
        if (src_url) {
            db_anime_url['episodes'][url] = src_url
            // 更新解析地址
            await db_url.put(anime_id, db_anime_url)
        }
    } else {
        src_url = db_anime_url['episodes'][url]
    }
    // console.log('db_anime_url', db_anime_url)
    let db_anime_info = {
        'animes': [{ 'animeTitle': title }],
        'idx': 0,
        'episode_dif': 0,
    }

    let db_info_value = await db_info.get(anime_id)
    if (db_info_value != null) {
        db_anime_info = db_info_value
    } else {
        await db_info.put(anime_id, db_anime_info)
    }

    console.log('db_anime_info', db_anime_info)

    console.log('src_url', src_url)
    return {
        src_url,
        db_anime_info,
        db_anime_url,
    }
}

export {
    save_anime_info_db
}
