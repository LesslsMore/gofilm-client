<template>
  <div class="player_area" v-show="data.loading">
    <div class="player_p">
<!--      <div class="video-player" ref="artContainer"></div>-->
      <iframe class="video-player" id="video_player" :src="`${play}/play`" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
    <div class="current_play_info">
      <div class="play_info_left">
        <h3 class="current_play_title"><a :href="`/filmDetail?link=${data.detail.id}`">{{ data.detail.name }}</a>{{ data.current.episode }}</h3>
        <div class="tags">
          <a :href="`/filmClassifySearch?Pid=${data.detail.pid}&Category=${data.detail.cid}`">
            <el-icon>
              <Promotion/>
            </el-icon>
            {{ data.detail.descriptor.cName }}</a>
          <span>{{ data.detail.descriptor.classTag ? data.detail.descriptor.classTag.replaceAll(',', '/') : '未知' }}</span>
          <span class="hidden-sm-and-down">{{ data.detail.descriptor.year }}</span>
          <span class="hidden-sm-and-down">{{ data.detail.descriptor.area }}</span>
        </div>
      </div>
      <div class="play_info_right">
        <a href="javascript:;" :class="`iconfont icon-play1 ${data.autoplay?'p_r_active':''}`" @click="()=>{data.autoplay= !data.autoplay}"></a>
        <a v-show="hasNext" href="javascript:;" class="iconfont icon-iov-next" @click="playNext"></a>
      </div>
    </div>
    <div class="play-module">
      <div class="play-module-item">
        <div class="module-heading">
          <p class=" play-module-title">播放列表</p>
          <div class="play-tab-group">
            <a href="javascript:;" :class="`play-tab-item ${data.currentTabId == item.id ? 'tab-active':''}`" v-for="item in data.detail.list" @click="changeTab(item.id)">{{ item.name }}</a>
          </div>
        </div>
        <div class="play-list">
          <div class="play-list-item" v-show="data.currentTabId == item.id" v-for="item in data.detail.list">
            <a :class="`play-link ${v.link == data.current.link?'play-link-active':''}`" v-for="(v,i) in item.linkList" href="javascript:;" @click="playChange({sourceId: item.id, episodeIndex: i, target: this})">{{ v.episode }}
              <div class="loading-wave" v-if="v.link == data.current.link">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
              </div>
              <div class="loading-wave" v-else></div>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="correlation">
      <RelateList :relateList="data.relate"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, inject, onBeforeMount, onMounted, reactive, ref, watch} from "vue";
import { useRouter } from "vue-router";
import { ApiGet } from "../../utils/request";
import { ElMessage } from "element-plus";
import RelateList from "../../components/index/RelateList.vue";
import { Promotion } from "@element-plus/icons-vue";
import posterImg from '@/assets/image/play.png'
import { cookieUtil, COOKIE_KEY_MAP } from '../../utils/cookie'
import { fmt } from "../../utils/format";


const artContainer = ref(null);
let art: any = null;
let play = import.meta.env.VITE_PLAY_URL

const data = reactive({
  loading: false,
  detail: {
    id: '',
    cid: '',
    pid: '',
    name: '',
    picture: '',
    playFrom: [],
    DownFrom: '',
    playList: [[]],
    downloadList: '',
    descriptor: {
      subTitle: '',
      cName: '',
      enName: '',
      initial: '',
      classTag: '',
      actor: '',
      director: '',
      writer: '',
      blurb: '',
      remarks: '',
      releaseDate: '',
      area: '',
      language: '',
      year: '',
      state: '',
      updateTime: '',
      addTime: '',
      dbId: '',
      dbScore: '',
      hits: '',
      content: '',
    },
    list: [],
  },
  current: {index: 0, episode: '', link: ''},
  relate: [],
  currentTabId: '',
  autoplay: true,
  options: {
    title: "",
    src: "",
    volume: 0.6,
    currentTime: 50,
  },
})

const hasNext = computed(() => {
  let flag = false
  data.detail.list.forEach((item: any) => {
    if (data.currentTabId == item.id) {
      flag = data.current.index != item.linkList.length - 1
    }
  })
  return flag
})

const router = useRouter()
const global = inject<any>('global')

const changeTab = (id: string) => {
  data.currentTabId = id
}

const playChange = (play: { sourceId: string, episodeIndex: number, target: any }) => {
  data.detail.list.forEach((item: any) => {
    if (item.id == play.sourceId) {
      let currPlay = item.linkList[play.episodeIndex]
      data.current = {index: play.episodeIndex, episode: currPlay.episode, link: currPlay.link}
      data.options.src = currPlay.link
      data.options.title = data.detail.name + "  " + currPlay.episode
      data.currentTabId = play.sourceId
    }
  })
}

const isAutoPlay = () => {
  if (!data.autoplay) {
    return
  }
  playNext()
}

const playNext = () => {
  if (!hasNext.value) {
    return
  }
  playChange({sourceId: data.currentTabId, episodeIndex: data.current.index + 1, target: ''})
  if (data.autoplay) {
    setTimeout(() => {
      if (art) art.play();
    }, 1000)
  }
}

watch(() => data.current.link, (newVal) => {
  if (newVal) {
    // initArtPlayer();

    const anime_id = data.detail.id
    const title = data.detail.name
    const url = data.current.link
    const episode = data.current.index + 1

    // updateArtPlayer(anime_id, title, url, episode);

    function get_param_url(animeId, episode, title, videoUrl) {
      const queryParams = new URLSearchParams();
      if (animeId) queryParams.append('anime_id', animeId);
      if (episode) queryParams.append('episode', episode);
      if (title) queryParams.append('title', title);
      if (videoUrl) queryParams.append('url', videoUrl);
      return queryParams.toString();
    }

    // await get_url(url)

    let play_url = `${play}/play?${get_param_url(anime_id, episode, title, url)}`
// play_url = `https://jx.nnsvip.cn/?url=${web_video_info.src_url}`
    document.querySelector("iframe").src = play_url
  }
});

const saveFilmHisroy = () => {
  // if (data.options.src.length > 0) {
  //   let player = artInstance && artInstance.video;
  //   let history = cookieUtil.getCookie(COOKIE_KEY_MAP.FILM_HISTORY) ? JSON.parse(cookieUtil.getCookie(COOKIE_KEY_MAP.FILM_HISTORY)) : {}
  //   let link = `/play?id=${data.detail.id}&source=${data.currentTabId}&episode=${data.current.index}&currentTime=${player.currentTime}`
  //   let timeStamp = new Date().getTime()
  //   let time = fmt.dateFormat(timeStamp)
  //   let progress = `${fmt.secondToTime(player.currentTime)} / ${fmt.secondToTime(player.duration)}`
  //   history[data.detail.id] = {
  //     id: data.detail.id,
  //     name: data.detail.name,
  //     picture: data.detail.picture,
  //     episode: data.current.episode,
  //     time: time,
  //     timeStamp: timeStamp,
  //     source: data.currentTabId,
  //     link: link,
  //     currentTime: player.currentTime,
  //     duration: player.duration,
  //     progress: progress,
  //     devices: global.isMobile
  //   }
  //   cookieUtil.setCookie(COOKIE_KEY_MAP.FILM_HISTORY, JSON.stringify(history))
  // }
}

window.addEventListener('beforeunload', saveFilmHisroy)

onBeforeMount(() => {
  let query = router.currentRoute.value.query
  ApiGet(`/filmPlayInfo`, {id: query.id, playFrom: query.source, episode: query.episode}).then((resp: any) => {
    if (resp.code === 0) {
      data.detail = resp.data.detail
      data.current = {index: resp.data.currentEpisode, ...resp.data.current}
      data.relate = resp.data.relate
      data.options.src = data.current.link
      data.currentTabId = resp.data.currentPlayFrom
      data.loading = true
    } else {
      ElMessage.error({message: resp.msg})
    }
  })
})
</script>

<style scoped>
@import "/src/assets/css/film.css";
/*vue3-video-play 相关设置*/
/*//播放器控件区域大小*/
.video-player {
  width: 100% !important;
  height: 100% !important;
  position: absolute;
  border-radius: 6px;

}

:deep(.vjs-big-play-button) {
  line-height: 2em;
  height: 2em;
  width: 2em;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.65);
}

:deep(.vjs-control-bar) {
  background: rgba(0, 0, 0, 0.32);
}

/*取消video被选中的白边*/
:deep(video:focus) {
  border: none !important;
  outline: none;
}

:deep(.data-vjs-player:focus) {
  border: none !important;
  outline: none;
}

:deep(.vjs-tech) {
  border-radius: 6px;
}

:deep(img) {
  border-radius: 6px;
}

/*进度条配色*/
:deep(.video-js .vjs-load-progress div) {
  background: rgba(255, 255, 255, 0.55) !important;
}

:deep(.video-js .vjs-play-progress) {
  background: #44c8cf;
}

:deep(.video-js .vjs-slider) {
  background-color: hsla(0, 0%, 100%, .2);
}


/*当前播放的影片信息展示*/
.current_play_info {
  width: 100%;
  padding: 15px 5px;
  text-align: left;
  display: flex;
  justify-content: space-between;
}

.current_play_title {
  font-weight: 600;
  color: rgb(201, 196, 196);
  margin: 0 0 12px 0;
}

.current_play_title a {
  color: rgb(201, 196, 196);
  font-weight: 600;
  margin-right: 16px;
}

.current_play_title a:hover {
  color: orange;
}

/*自动播放 & 下一集链接*/

.play_info_right a {
  margin-left: 10px;
  padding: 15px 20px;
  display: inline-block;
  font-size: 20px;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.p_r_active {
  color: #FFBB5C;
}


/* 播放区域*/
.player_area {
  width: 100%;
  min-height: 100%;
}


@media (min-width: 768px) {
  .player_area {
    padding: 10px 6%;
  }

  .tags a {
    padding: 5px 10px;
/*    background-color: rgba(155, 73, 231, 0.72);*/
    background: linear-gradient( #9B49E7B8, #9B49E799);
    color: #c4c2c2;
    font-size: 13px;
    border-radius: 6px;
    margin-right: 15px;
  }

  .tags span {
    padding: 6px 12px;
    /*background-color: #404042;*/
    background: linear-gradient(#fff2, #ffffff1a);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #b5b2b2;
    border-radius: 5px;
    margin: 0 8px;
    font-size: 12px;
  }

  .play_content a {
    white-space: nowrap;
    font-size: 12px;
    min-width: calc(10% - 24px);
    padding: 6px 10px;
    color: #ffffff;
    border-radius: 6px;
    margin: 8px 12px;
    background: #888888;
  }

  .play_info_right a:hover {
    color: #FFBB5C;
    background: rgb(0, 0, 0, 0.2);
  }

}


.player_p {
  width: 100%;
  /*height: 700px;*/
  margin: 0;
  padding-bottom: 56.25% !important;
  position: relative;
  border-radius: 6px;
  display: flex;
}


/*右侧播放源选择区域*/
/*影片播放列表信息展示*/
/*影片播放列表信息展示*/
.play_list {
  width: 100%;
  border-radius: 10px;
  background: #2e2e2e;
  margin-top: 50px;
  position: relative;
}

.play_content {
  display: flex;
  flex-flow: row wrap;
  padding: 10px 10px 10px 10px;

}

.play_list > h2 {
  position: absolute;
  left: 10px;
  top: -10px;
  z-index: 50;
}

/*推荐列表区域*/
.correlation {
  width: 100%;
}

</style>

<!--移动端-->
<style scoped>

/*适应小尺寸*/
@media (max-width: 768px) {
  .player_area {
    padding: 5px 10px;
  }

  .tags a {
    padding: 5px 10px;
    color: #c4c2c2;
    background: linear-gradient( #9B49E7B8, #9B49E799);
    font-size: 13px;
    border-radius: 6px;
    margin-right: 3px;
  }


  .play_content a {
    white-space: nowrap;
    color: #ffffff;
    border-radius: 6px;
    margin: 6px 8px;
    background: #888888;
    min-width: calc(25% - 16px);
    font-size: 12px;
    padding: 6px 12px !important;
  }

  .tags span {
    padding: 6px 10px;
    background: linear-gradient(#fff2, #ffffff1a);
    color: #b5b2b2;
    border-radius: 5px;
    margin: 0 3px;
    font-size: 12px;
  }

  :deep(.el-tabs__item) {
    width: 70px;
    height: 35px;
    margin: 17px 5px 0 0 !important;
    font-size: 13px;
  }

  .play_info_right {
    display: flex;
    flex-direction: row;
  }

  .play_info_right a {
    margin-left: 5px;
    display: inline-block;
    padding: 2px 8px;
    font-size: 20px;
    height: 36px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
  }

  .play_info_right a:active {
    color: #FFBB5C;
    background: rgb(0, 0, 0, 0.2);
  }
}
</style>

