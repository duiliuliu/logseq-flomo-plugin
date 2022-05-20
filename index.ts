import '@logseq/libs';
import { SettingSchemaDesc,IBatchBlock } from '@logseq/libs/dist/LSPlugin';

interface Memo {
  content: string;
  created_at: string;
  creator_id: string;
  deleted_at: string;
  updated_at: string;
  slug: string;
  files;
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
async function loadDatas(
  isToday: boolean = false
): Promise<Array<IBatchBlock>> {
  let session = logseq.settings?.session;
  let offset = logseq.settings?.offset;
  let limit = isToday ? 20 : logseq.settings?.limit;
  let tag = logseq.settings?.tag;

  let data = await fetch(
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
    .catch((e) => {
      logseq.App.showMsg(e);
      return [];
    });

  return data
    .map((item) => {
      let files = item.files ? item.files : [];
      files.forEach((el) => {
        item.content = item.content + ` ![flomo image](${el?.url})`;
      });
      return {
        content: `#☘️.memo ${item.content}`,
        properties: {
          memo_link: `https://flomoapp.com/mine/?memo_id=${memo.slug}`,
          "created-at": new Date(item.created_at).getTime(),
          "updated-at": new Date(item.updated_at).getTime(),
          "deleted-at": item.deleted_at
            ? new Date(item.deleted_at).getTime()
            : "",
        },
      };
    })
    .reverse();
}

//Inputs 5 numbered blocks when called
async function insertSomeBlocks(e, isToday: boolean = false) {
    if (logseq.settings?.session == null || logseq.settings?.session == "") {
      logseq.App.showMsg("请配置session");
      return;
    }
    let data: Array<IBatchBlock> = await loadDatas(isToday);
    if(data == null || data.length==0){
      return;
    }
    logseq.Editor.updateBlock(e.uuid, "🚀🚀🚀loadind...");
    logseq.Editor.insertBatchBlock(e.uuid, data, { sibling: true });
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
 
/** 隐藏memo图标 */
a.tag[data-ref*="☘️.memo"]:before {
  content: "☘️";
  font-size: 0.75rem;
  line-height: 0.75rem;
}
a.tag[data-ref*="☘️.memo"]:hover:before {
  padding-right: 0.3rem;
}
a.tag[data-ref*="☘️.memo"]:hover {
  content: "";
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

div[data-refs-self*="☘️.memo"] .block-properties {
  font-size: 10px;
  border-radius: 5px;
  padding: 0 1px;
  margin: 0px;
  background-color: var(--ls-block-properties-background-color, #f0f8ff);
}

  `);
}

logseq.ready(main).catch(console.error);

