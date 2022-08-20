## flomo_memos_sync

同步 flomo 笔记至 logseq

## 环境配置

session 必须配置
![setting](./images/setting.png)

session 获取方式 --> web cookie中截取session值


## 使用

`/memo` 按照配置同步当前 flomo 笔记
`/memoToday` 同步今日 memo 笔记
![memo](./images/memo.png)

## 其他

- [flomo 请求代理](https://github.com/duiliuliu/flomo-api-proxy)
- [logseq 插件模板](https://github.com/QWxleA/logseq-plugin-starter-template)

- **session 过期会导致拉取不到数据；** 遇到拉取不到数据问题时，请尝试更新session数据