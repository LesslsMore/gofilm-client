<template>
  <div class="header">
    <!-- 左侧logo以及搜索 -->
    <div class="nav_left">
      <!--        <img class="logo" src="/src/assets/logo.png">-->
      <!--<el-avatar class="logo" :size="45" :src="data.site.logo" alt="GoFilm"/>-->
      <a href="/" class="site">{{ data.site.siteName }}</a>
      <div class="search_group">
        <input v-model="keyword" @keydown="(e)=>{e.keyCode == 13 && searchFilm()}" placeholder="搜索 动漫,剧集,电影 "
               class="search"/>
        <el-button @click="searchFilm" :icon="Search"/>
      </div>
    </div>
    <!--右侧顶级分类导航 -->
    <div class="nav_right">
      <div class="nav_link">
        <a href="/">首页</a>
        <template v-for="n in data.nav">
          <a :href="`/filmClassify?pid=${n.id}`">{{ n.name }}</a>
        </template>
      </div>
      <div class="history-link hidden-md-and-down" v-on:mouseenter="handleHistory(true)"
           v-on:mouseleave="handleHistory(false)">
        <a :href="`/filmClassify?pid=${nav.variety.id}`">
          <b style="font-size: 22px;" class="iconfont icon-history"/>
        </a>
        <Transition name="fade-slide" duration="300">
          <div v-if="data.historyFlag" class="dropdown-container">
            <div class="history-h">
              <b class="iconfont icon-record history-h-icon"/>
              <span class="history-h-title">历史观看记录</span>
              <a v-if="data.historyList.length > 0" class="iconfont icon-clear1 history-del" @click="clearHistory"/>
            </div>
            <div v-if="data.historyList.length > 0" class="history-c">
              <a :href="h.link" class="history-c-item" v-for="h in data.historyList">
                <span class="history-c-item-t">{{ h.name }}</span>
                <span class="history-c-item-e">{{ h.episode }}</span>
              </a>
            </div>
            <el-empty style="padding: 10px 0;" v-else description="暂无观看记录"/>
          </div>
        </Transition>
      </div>
      <!--        <span style="color:#777; font-weight: bold">|</span>-->
      <a href="/search" class="hidden-md-and-up">
        <el-icon style="font-size: 18px">
          <Search/>
        </el-icon>
      </a>


    </div>
    <!--弹窗模块,显示按钮对应信息-->
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {Search, CircleClose} from '@element-plus/icons-vue'
import {ElMessage} from "element-plus";
import {ApiGet} from "../../utils/request";
import {cookieUtil, COOKIE_KEY_MAP} from "../../utils/cookie";

// 搜索关键字
const keyword = ref<string>('')
// 弹窗隐藏显示
const data = reactive({
  historyFlag: false,
  historyList: [{}],
  nav: Array,
  site: Object,
})


// 加载观看历史记录信息
const handleHistory = (flag: boolean) => {
  data.historyFlag = flag
  if (flag) {
    // 获取cookie中的filmHistory
    let historyMap = cookieUtil.getCookie(COOKIE_KEY_MAP.FILM_HISTORY) ? JSON.parse(cookieUtil.getCookie(COOKIE_KEY_MAP.FILM_HISTORY)) : null
    let arr = []
    if (historyMap) {
      for (let k in historyMap) {
        arr.push(historyMap[k])
      }
      arr.sort((item1, item2) => item2.timeStamp - item1.timeStamp)
    }
    data.historyList = arr
  }
}
const clearHistory = () => {
  cookieUtil.clearCookie(COOKIE_KEY_MAP.FILM_HISTORY)
  data.historyList = []
}

// 从父组件获取当前路由对象
const router = useRouter()
// 影片搜索
const searchFilm = () => {
  if (keyword.value.length <= 0) {
    ElMessage.error({message: "请先输入影片名称关键字再进行搜索", duration: 1500})
    return
  }
  location.href = `/search?search=${keyword.value}`
  // router.push({path: '/search', query:{search: keyword.value}, replace: true})
}

// 导航栏挂载完毕时发送一次请求拿到对应的分类id数据
const nav = reactive({
  cartoon: {},
  film: {},
  tv: {},
  variety: {},
})

// 获取站点信息
const getBasicInfo = () => {
  ApiGet(`/config/basic`).then((resp: any) => {
    if (resp.code === 0) {
      data.site = resp.data
    } else {
      ElMessage.error({message: resp.msg})
    }
  })
}
onMounted(() => {
  ApiGet('/navCategory').then((resp: any) => {
    if (resp.code === 0) {
      data.nav = resp.data
    } else {
      ElMessage.error({message: "导航分类信息获取失败", duration: 1000})
    }
  })
  getBasicInfo()
})


</script>


<!--移动端适配-->
<style>
/*小尺寸时隐藏状态栏*/
@media (max-width: 768px) {
  .nav_right {
    display: flex;
    width: 100%;
    justify-content: space-between;
    height: 40px;
  }

  .nav_link {
    display: flex;
    justify-content: space-between;
    height: 40px;
    width: 90%;
    overflow-y: scroll;
  }

  .nav_link a {
    white-space: nowrap;
    color: #ffffff;
    flex-basis: calc(19% - 5px);
    padding: 0 10px;
    line-height: 40px;

  }

  .nav_right .hidden-md-and-up {
    color: #ffffff;
    flex-basis: calc(19% - 5px);
    padding: 0 10px;
    line-height: 40px;
  }

  .nav_right a:hover {
    color: #ffffff;
    /*background-color: transparent;*/
  }

  .header {
    width: 100% !important;
    height: 40px;
    background: radial-gradient(circle, #d275cd, rgba(155, 73, 231, 0.72), #4ad1e5);
  }

  .nav_left {
    display: none !important;
    width: 90% !important;
    margin: 0 auto;
  }
}
</style>

<style scoped>
@media (min-width: 768px) {
  .header {
    width: 78%;
    z-index: 0;
    max-height: 40px;
    line-height: 60px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
  }

  .nav_left {
    display: flex;
  }

  /*site标志样式*/
  .site {
    font-weight: 600;
    font-style: italic;
    font-size: 24px;
    margin-right: 5px;
    background: linear-gradient(118deg, #e91a90, #c965b3, #988cd7, #00acfd);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /*搜索栏*/
  .search_group {
    width: 80%;
    margin: 10px auto;
    display: flex;
  }

  .search {
    flex: 10;
    background-color: #2e2e2e !important;
    border: none !important;
    height: 40px;
    border-radius: 6px 0 0 6px;
    padding-left: 20px;
    color: #c9c4c4;
    font-size: 15px;
    font-weight: bold;
    line-height: 60px;
  }

  .search::placeholder {
    font-size: 15px;
    color: #999999;
  }

  .search:focus {
    outline: none;
  }

  .search_group button {
    flex: 1;
    margin: 0;
    background-color: #2e2e2e;
    color: rgb(171, 44, 68);
    border: none !important;
    height: 40px;
    border-radius: 0 6px 6px 0;
    font-size: 20px;
    /*margin-bottom: 2px*/
  }

  .nav_right {
    display: flex;
    height: 60px;
    flex-direction: row;
  }

  .nav_right a {
    min-width: 60px;
    height: 40px;
    line-height: 40px;
    margin: 10px 10px;
    font-size: 15px;
    text-align: center;
    font-weight: bold;
  }

  .nav_right a:hover {
    color: orange;
  }

  .logo {
    height: 40px;
    margin-top: 10px;
  }

  /*history preview*/
  /*element-plus empty state color style*/
  :deep(.el-empty) {
    --el-empty-fill-color-1: rgba(155, 73, 231, 0.72);
    --el-empty-fill-color-2: #67d9e891;
    --el-empty-fill-color-3: rgb(106 19 187 / 72%);
    --el-empty-fill-color-4: #67d9e8;
    --el-empty-fill-color-5: #5abcc9;
    --el-empty-fill-color-6: #9fb2d9;
    --el-empty-fill-color-7: #61989f;
    --el-empty-fill-color-8: #697dc5;
    --el-empty-fill-color-9: rgb(43 51 63 / 44%);
  }

  .history-c {
    max-height: 200px;
    overflow-y: scroll;
    margin-top: 12px;
    margin-bottom: 12px;
  }

  .history-c .history-c-item {
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
    line-height: 40px;
  }

  .history-c-item::before {
    content: '';
    height: 10px;
    width: 10px;
    display: inline-block;
    position: absolute;
    left: 22px;
    border: 2px solid orangered;
    background: #fff;
    border-radius: 50%;
    top: 15px;
  }

  .history-c-item::after {
    content: '';
    border-left: 1px solid #dbdee2;
    position: absolute;
    left: 28px;
    top: 0;
    height: 100%;
    z-index: -1;
  }

  .history-c-item:hover:before {
    content: '';
    height: 10px;
    width: 10px;
    display: inline-block;
    position: absolute;
    left: 22px;
    border: 2px solid orangered;
    background: rgba(220, 59, 182, 0.97);
    border-radius: 50%;
    top: 15px;
  }


  .history-c-item .history-c-item-t {
    width: 100%;
    text-align: left !important;
    position: relative;
    padding: 5px 5px 2px 55px;
    margin: 0 10px;
    flex: 2;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    -o-text-overflow: ellipsis;
  }

  .history-c-item-e {
    flex: 1;
    color: rgba(255, 255, 255, 0.38);
    padding: 5px 0 2px 0;
  }

  /*历史记录标题域*/
  .history-h {
    width: 100%;
    display: flex;
    justify-content: start;
    border-bottom: 2px solid rgba(255, 255, 255, .15);
  }

  .history-h-icon {
    flex: 1;
    font-size: 24px;
    color: orangered;
  }

  .history-h-icon::before {
    margin-right: 6px;
  }

  .history-h-title {
    flex: 3;
    text-align: left;
    font-size: 18px;
  }

  .history-del {
    flex: 1;
    font-size: 25px;
    color: #99999991;
  }

  .history-del:hover {
    color: orangered;
  }

  .nav_right a {
    position: relative;
  }

  .dropdown-container {
    position: absolute;
    top: 100%;
    left: 50%;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.38);
    margin-top: 12px;
    min-width: 300px;
    max-width: 330px;
    height: auto;
    z-index: 1000;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.85);
    transform: translate3d(-50%, 0, 0);

  }

  .history-link {
    position: relative;
    min-width: 60px;
    height: 40px;
    line-height: 40px;
    margin: 10px 10px;
    font-size: 15px;
    text-align: center;
    font-weight: bold;
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.8s linear;
  }

  .fade-slide-enter,
  .fade-slide-leave-to {
    opacity: 0;
    transform: translate3d(-50%, -10px, 0);
  }
}
</style>
