<template>
  <div class="wrap">
    <transition name="fade">
      <div v-if="loading" class="Loading" key="loading">
        <Loading class="loadingIcon" color="#1989fa" size="50px"/>
      </div>
    </transition>
    <div class="page" v-if="data && !data.errno">
      <div class="content" ref="content">
        <div class="navBar" v-if="data">
          <div class="left">
            <p class="top">
              {{data.subject}}
            </p>
            <p class="bottom">
              {{data.postlists[0].dateline}}
              <vTag v-if="data.readperm > 0" round style="margin-left: 8px" color="#dd6161" type="danger">
                {{data.readperm}}权限
              </vTag>
            </p>
          </div>
          <div class="right">
            <vSwitch v-model="checked" size="20px"></vSwitch>
          </div>
        </div>
        <div v-for="(item, index) of data.postlists" :key="index" class="item">
          <div class="plot">
            <div class="left">
              <div class="top">
                <vIcon name="clock-o"></vIcon>
                <span class="time">{{item.dateline}}</span>
                <vTag v-if="data.authorid === item.authorid" type="primary" color="#2b85e4">楼主</vTag>
              </div>
              <div class="bottom">
                <div class="message">
                  {{item.message}}
                </div>
              </div>
            </div>
            <div class="right">
              <vIcon v-if="item.ratelog" name="good-job-o" size="16" :badge="item.ratelog"></vIcon>
            </div>
          </div>
          <div v-if="item.attachs" class="image" v-show="checked">
            <vImage v-for="(img, index) of item.attachs" :key="index" :src="img" @click="preview(item.attachs, index)" fit="scale-down" class="img">
              <template v-slot:loading>
                <Loading color="#1989fa" size="20">图片加载中...</Loading>
              </template>
              <template v-slot:error>图片加载失败</template>
            </vImage>
          </div>
          <div v-if="item.comments" class="comments">
            <div class="comment" v-for="({ comment, authorid }, index) of item.comments" :key="index">
              <vTag v-if="data.authorid === authorid" type="primary" color="#2b85e4">楼主</vTag>
              {{comment}}
            </div>
          </div>
        </div>
        <Collapse v-model="showDeclare" v-if="!loading && page === 1">
          <CollapseItem name="1">
            <template #title>
              <div style="font-size: 12px;color: #909399">声明</div>
            </template>
            <div style="font-size: 12px;color: #c0c4cc;white-space: pre-line">
              页面采用缓存技术，同时对原网站页面进行重排版，便于快速打开和浏览，如有侵权请联系本人，将在24小时内删除。<br/>
              网站内容均采集于互联网，此页面仅做整合处理，任何言论等内容引起的法律等风险由原发帖人承担。使用此网站即认同此声明</div>
          </CollapseItem>
        </Collapse>
      </div>
      <div class="Pagination" :style="{'paddingBottom': needSafeArea ? '22px' : '0'}">
        <Pagination v-model="page" mode="simple" :page-count="data.totalpage" force-ellipses @change="getData(tid, $event)"/>
      </div>
    </div>
    <Empty v-if="data && data.errno" :description="data.errMsg">
      <div>
        <a style="color: #a0cfff" :href="'http://www.zuanke8.com//forum.php?mod=viewthread&tid=' + tid + '&mobile=2'">原文链接</a>
      </div>
    </Empty>
  </div>
</template>

<script>
import axios from 'axios'
import { Switch as vSwitch, Icon as vIcon, Tag as vTag, Image as vImage, Loading, ImagePreview, Pagination, Collapse, CollapseItem, Empty } from 'vant'

export default {
  name: 'App',
  components: {
    vSwitch,
    vIcon,
    vTag,
    vImage,
    Loading,
    Pagination,
    Collapse,
    CollapseItem,
    Empty
  },
  data () {
    return {
      checked: true,
      isLoading: false,
      data: null,
      page: 1,
      tid: null,
      loading: true,
      isCache: false,
      showDeclare: [],
      needSafeArea: false,
      cacheTask: null,
      getDataTask: null
    }
  },
  methods: {
    getData (tid, page = 1) {
      this.loading = true
      this.showDeclare = []
      if (this.cacheTask) this.cacheTask.cancel()
      if (this.getDataTask) this.getDataTask.cancel()
      // 从缓存中获取
      this.cacheTask = axios.CancelToken.source()
      this.getDataTask = axios.CancelToken.source()
      axios({
        methods: 'GET',
        url: 'https://056b0a74-612a-43fe-b0de-e76d6f3c5311.bspapp.com/http/main/page',
        params: {
          tid,
          page,
          cache: 1
        },
        cancelToken: this.cacheTask.token
      }).then((res) => {
        this.cacheTask = null
        if (res.status === 200) {
          this.isCache = true
          if (res.data) {
            const data = res.data
            this.data = { ...data }
            if (data.subject) document.title = data.subject
            this.loading = false
          }
        }
      })
      // 从网络获取
      axios({
        methods: 'GET',
        url: 'https://056b0a74-612a-43fe-b0de-e76d6f3c5311.bspapp.com/http/main/page',
        params: {
          tid,
          page
        },
        cancelToken: this.getDataTask.token
      }).then((res) => {
        if (res.status === 200 && res.data) {
          this.getDataTask = null
          this.isCache = false
          if (res.data && !res.errno) {
            const data = res.data
            this.data = { ...data }
            if (data.subject) document.title = data.subject
            this.loading = false
          } else if (res.errno) {
            const data = res.data
            this.data = { ...data }
          }
        }
      })
    },
    preview (attaches, index) {
      ImagePreview({
        images: attaches,
        startPosition: index
      })
    },
    getQueryString (name) {
      let params, ret
      if (location.hash) {
        params = (new URLSearchParams(location.hash.split('#')[1]))
        ret = parseInt(params.get(name))
      } else if (!location.hash || !ret) {
        params = (new URLSearchParams(location.search))
        ret = parseInt(params.get(name))
      }
      return ret || null
    }
  },
  mounted () {
    this.needSafeArea = window.screen.height / window.screen.width > 1.9
    const tid = this.getQueryString('tid')
    this.tid = tid
    this.$nextTick(() => {
      window.onload = () => {
        this.getData(tid)
      }
    })
  },
  watch: {
    loading: function () {
      this.$nextTick(() => {
        this.$refs.content.scrollTo(0, 0)
      })
    }
  }
}
</script>
<style lang="stylus" scoped>
  .page >>> .van-cell
    padding 0 !important
    padding-left 85% !important
    opacity .3
  .page >>> .van-tag
    user-select none
  .Loading
    height 100vh
    width 100vw
    z-index 999
    display flex
    justify-content center
    align-items center
  .fade-enter-active, .fade-leave-active
    transition: opacity .5s
  .fade-enter, .fade-leave-to
    opacity: 0
  .page
    width 100vw
    height 100vh
    position fixed
    display flex
    flex-direction column
    .navBar
      width 100vw
      min-height 30px
      flex-shrink 0
      display flex
      background #fefefe
      padding 8px 0
      box-shadow 0 -20px 40px rgba(0,0,0,.1)
      .left
        width 100%
        margin-left 8px
        p
          margin 0
          padding 0
        .top
          font-size 18px
          font-weight 600
          color #303133
          line-height 22px
        .bottom
          color #909399
          font-size 14px
          display flex
          align-items center
          user-select none
      .right
        margin-right 8px
        color #909399
        display flex
        align-items center
    .content
      width 100vw
      height 0
      flex 1
      overflow-x hidden
      overflow-y auto
      .item
        padding-bottom 8px
        border-bottom  1px solid #eeeeee
        .plot
          display flex
          justify-content space-between
          .left
            margin 0 12px 0 12px
            color #c3c3c3
            font-size 12px
            .time
              user-select none
              margin 0 8px 0 2px
            .top
              display flex
              align-items center
              margin 8px 0 2px 0
            .bottom
              display flex
              flex-direction column
              /*align-items center*/
              color #303133
              white-space pre-line
              .message
                margin-top 4px
                font-size 16px
                line-height 25px
          .right
            margin-top 16px
            display flex
            justify-content center
            align-items center
            width 30px
            margin-right 12px
        .image
          margin-left 12px
          .img
            min-height 40px
            width 70vw
        .comments
          margin 8px 20px 0 40px
          background #eeeeee
          .comment
            padding 8px 8px
            line-height 14px
            color #606266
            font-size 12px
            border-bottom 1px solid #ffffff
            &:last-child
              border-bottom none
    .Pagination
      box-shadow 0 20px 40px rgba(0,0,0,.5)
</style>
