import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

interface Memo {
  content: string;
  created_at: string;
  creator_id: string;
  deleted_at: string;
  updated_at: string;
  slug: string;
}


/**  配置化   */
const pluginName = ["{{% plugin-name %}}", "{{% plugin-title %}}"]
/** 设置logseq 配置项 */
function getSettingTemp(lang: string) {
  var data: SettingSchemaDesc[] = [
    {
      key: "session",
      title: "session",
      type: "string",
      default: "",
      description:
        lang === "zh-CN"
          ? "配置flomo session，可在web端获取"
          : "Configure flomo Session, which can be obtained on the Web.",
    },
    {
      key: "offset",
      title: "offset",
      type: "number",
      default: 0,
      description:
        lang == "zh-CN"
          ? "设置起始偏移量，默认为0，从最新一条开始获取memos"
          : "Set the starting offset, which defaults to 0, to get memOS from the last one.",
    },
    {
      key: "limit",
      title: "limit",
      type: "number",
      default: "5",
      description:
        lang == "zh-CN"
          ? "设置拉取flomo 数量，默认为5"
          : "Set the number of flomo pulls. Default is 5.",
    },
    {
      key: "tag",
      title: "tag",
      type: "string",
      default: "",
      description: lang == "zh-CN" ? "指定tag" : "flomo tag.",
    },
  ];
  return data;
}


/** 拉取 flomo memos */
async function getMemos(isToday: boolean = false): Promise<Array<Memo>> {
  const session = logseq.settings?.session;
  const offset = logseq.settings?.offset;
  const limit = isToday ? 20 : logseq.settings?.limit;
  const tag = logseq.settings?.tag;

  const data = await fetch(
    `https://duiliuliu.vercel.app/api/flomo?tag=${tag}&offset=${offset}&tz=8:0&limit=${limit}&flomo_session=${session}`
  )
    .then((response) => response.json())
    .then((data: { memos: Array<Memo> }) => {
      if (!isToday) {
        return data.memos;
      }
      return data.memos.filter(
        (memo) => new Date(memo.created_at).getDay() == new Date().getDay()
      );
    })
  return data;
}

//Inputs 5 numbered blocks when called
async function insertSomeBlocks(e, isToday: boolean = false) {
  console.log("Open the calendar!");

  /** 过度 */
  logseq.Editor.updateBlock(e.uuid, '[:i "loadind..☘️..☘️..☘️."]');

    try {
      let memos: Array<Memo> = await getMemos(isToday);
      memos.forEach((memo) => {
        let blockProp = {
          memo_link: `https://flomoapp.com/mine/?memo_id=${memo.slug}`,
          "created-at": new Date(memo.created_at).getTime(),
          "updated-at": new Date(memo.updated_at).getTime(),
          "deleted-at": memo.deleted_at
            ? new Date(memo.deleted_at).getTime()
            : "",
        };
        logseq.Editor.insertBlock(e.uuid, `#☘️.memo ${memo.content}`, {
          sibling: true,
          properties: blockProp,
        });
      });
      /** 结束过渡 */
      logseq.Editor.updateBlock(e.uuid, "");
    } catch (error) {
      logseq.App.showMsg(error);
    }

}
  

const main = async () => {
  console.log(`Plugin: ${pluginName[1]} loaded`);

  const { preferredLanguage: lang } = await logseq.App.getUserConfigs()

  logseq.useSettingsSchema(getSettingTemp(lang));

  logseq.Editor.registerSlashCommand("memo", async (e) => {
    insertSomeBlocks(e);
  });

  logseq.Editor.registerSlashCommand("memoToday", async (e) => {
    insertSomeBlocks(e, true);
  });
  
  logseq.provideStyle(`
      /* === flomo ☘️.memo ====*/
      div[data-refs-self*="☘️.memo"] {
        margin: 20px 0;
        background: rgb(248, 253, 247);
        padding: 20px 0;
        border-radius: 10px;
      }
      div[data-refs-self*="☘️.memo"]:hover {
        box-shadow: 0px 2px 16px #dddddd;
      }
      div[data-refs-self*="☘️.memo"]
        > .block-children-container.flex
        > .block-children {
        color: #323232;
        font-size: 14px;
      }
      div[data-refs-self*="☘️.memo"]
        > .block-children-container.flex
        > .block-children
        > div.ls-block {
        line-height: 1.8;
        min-height: 20px;
        margin: 0;
      }
      a.tag[data-ref*="☘️.memo"]:before {
        content: "☘️";
        font-size: 0.75rem;
        line-height: 0.75rem;
      }
      a.tag[data-ref*="☘️.memo"]:hover:before {
        padding-right: 0.3rem;
      }
      a.tag[data-ref*="☘️.memo"]:hover {
        font-size: 0.75rem;
        line-height: 0.75rem;
      }
      a.tag[data-ref*="☘️.memo"] {
        font-size: 0px;
        font-family: iosevka, fira code, consolas, source code pro;
        color: #61f825;
        background-color: #e5f7ed;
        border: 0.5px solid #fcfff5;
        border-radius: 5px;
        padding: 0 1px;
      }  
  `);
}

logseq.ready(main).catch(console.error);

