import {findModuleExport, Patch} from "@decky/ui";
import {replacePatch} from "decky-frontend-lib";
import remarkHtml from "remark-html"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import {unified} from "unified"
import html2bbcode from "./html2bbcode";
import {Mutex} from 'async-mutex';
import {fetchReleases, isBazziteBranchTesting} from "./FetchReleases";

const PartnerEventStore = findModuleExport(
  (e) => e?.prototype?.InternalLoadAdjacentPartnerEvents
);

const SteamID = findModuleExport(
  (e) => e?.prototype?.BIsClanAccount
    && e?.prototype?.BIsIndividualAccount
    && e?.prototype?.BIsValid
    && e?.prototype?.ConvertTo64BitString
    && e?.prototype?.GetAccountID
    && e?.prototype?.GetAccountType
    && e?.prototype?.GetInstance
    && e?.prototype?.GetUniverse
    && e?.prototype?.Render
    && e?.prototype?.SetAccountID
    && e?.prototype?.SetAccountType
    && e?.prototype?.SetFromComponents
    && e?.prototype?.SetInstance
    && e?.prototype?.SetUniverse
);

const steamClanSteamID = "103582791470414830";
const steamClanID = "40893422";
const steamOSAppId = 1675200;
let generator: AsyncGenerator<any, undefined, unknown>;
const mutex = new Mutex();
const cachedGithubReleases: { gid: string, release: any }[] = [];

enum SteamEventType {
  // SmallUpdate = 12,
  Update = 13,
  // BigUpdate = 14,
}

type SteamTags = {
  require_tags?: string[]
}

enum SteamOSChannel {
  Stable = "stablechannel",
  Beta = "betachannel",
  // Preview = "previewchannel",
}

export function patchPartnerEventStore(): Patch[] {
  const loadAdjacentPartnerEventsPatch = replacePatch(
    PartnerEventStore.prototype,
    "LoadAdjacentPartnerEvents",
    async function (args) {
      let [gidEvent, gidAnnouncement, appId, countBefore, countAfter, tags, token] = args;
      const module = this;

      if (appId !== steamOSAppId) {
        return module.InternalLoadAdjacentPartnerEvents(gidEvent, void 0, gidAnnouncement, appId, countBefore, countAfter, tags, token);
      }

      return mutex.runExclusive(async () => {
        return LoadBazziteReleasesAsPartnerEvents(module, gidEvent?.GID || gidEvent?.AnnouncementGID, tags, countBefore, countAfter);
      });
    }
  );

  const loadAdjacentPartnerEventsByAnnouncementPatch = replacePatch(
    PartnerEventStore.prototype,
    "LoadAdjacentPartnerEventsByAnnouncement",
    async function (args) {
      let [gidEvent, gidAnnouncement, appId, countBefore, countAfter, tags, token] = args;
      const module = this;

      if (appId !== steamOSAppId) {
        return module.InternalLoadAdjacentPartnerEvents(void 0, gidEvent, gidAnnouncement, appId, countBefore, countAfter, tags, token);
      }

      return mutex.runExclusive(async () => {
        return LoadBazziteReleasesAsPartnerEvents(module, gidEvent?.GID || gidEvent?.AnnouncementGID, tags, countBefore, countAfter);
      });
    }
  );

  const loadAdjacentPartnerEventsByEventPatch = replacePatch(
    PartnerEventStore.prototype,
    "LoadAdjacentPartnerEventsByEvent",
    async function (args) {
      let [gidEvent, gidAnnouncement, appId, countBefore, countAfter, tags, token] = args;
      const module = this;

      if (appId !== steamOSAppId) {
        const clanId = gidAnnouncement || gidEvent.clanSteamID;

        return gidEvent.bOldAnnouncement
          ? module.InternalLoadAdjacentPartnerEvents(void 0, gidEvent.AnnouncementGID, clanId, appId, countBefore, countAfter, tags, token)
          : module.InternalLoadAdjacentPartnerEvents(gidEvent.GID, gidEvent.AnnouncementGID, clanId, appId, countBefore, countAfter, tags, token);
      }

      return mutex.runExclusive(async () => {
        return LoadBazziteReleasesAsPartnerEvents(module, gidEvent?.GID || gidEvent?.AnnouncementGID, tags, countBefore, countAfter);
      });
    }
  );

  return [
    loadAdjacentPartnerEventsPatch,
    loadAdjacentPartnerEventsByAnnouncementPatch,
    loadAdjacentPartnerEventsByEventPatch
  ]
}

async function LoadBazziteReleasesAsPartnerEvents(module: any, gid: any, tags: SteamTags, countBefore: number, countAfter: number) {
  const ret: any[] = [];

  // InternalLoadAdjacentPartnerEvents minified code, gets announcement from cache if it exists
  if (module.m_mapAdjacentAnnouncementGIDs.has(gid)) {
    // noinspection JSPrimitiveTypeWrapperUsage
    let e = module.m_mapAdjacentAnnouncementGIDs.get(gid)
      , r = new Array;
    // noinspection CommaExpressionJS
    if (e.forEach(((e: any) => {
        if (module.m_mapAnnouncementBodyToEvent.has(e)) {
          let t = module.m_mapAnnouncementBodyToEvent.get(e);
          ret.push(module.m_mapExistingEvents.get(t))
        } else
          r.push(e)
      }
    )),
    r.length > 0) {
      (await module.LoadBatchPartnerEventsByEventGIDsOrAnnouncementGIDs(null, r, tags)).forEach(((e: any) => ret.push(e)))
    }
  }

  if (cachedGithubReleases.length === 0) {
    await fetchMoreReleases(countAfter);
  }

  const releaseIndex = gid ? cachedGithubReleases.findIndex((e: any) => e.gid === gid) : -1;
  let releases: { gid: any, release: any }[];

  if (releaseIndex === -1) {
    releases = cachedGithubReleases.slice(0, countAfter);
  } else {
    if (releaseIndex + countAfter + 1 > cachedGithubReleases.length) {
      const toFetch = releaseIndex + countAfter + 1 - cachedGithubReleases.length;
      await fetchMoreReleases(toFetch);
    }

    releases = cachedGithubReleases.slice(Math.max(releaseIndex - countBefore + 1, 0), releaseIndex + countAfter + 1);
  }

  for (const {release} of releases) {
    const releasePublishedAt = Math.floor((new Date(release.published_at)).getTime() / 1000);

    const html = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkHtml)
      .process(release.body);

    const converter = new (html2bbcode.HTML2BBCode)();
    const bbcode = converter.feed(html.value);

    // haven't found a way to hide likes and comments yet
    const event = {
      "gid": String(release.id),
      "clan_steamid": steamClanSteamID,
      "event_name": release.name,
      "event_type": SteamEventType.Update,
      "appid": steamOSAppId,
      "server_address": "",
      "server_password": "",
      // start and end time are only used for certain event_type, not used for updates, but fill it anyway
      "rtime32_start_time": releasePublishedAt,
      "rtime32_end_time": releasePublishedAt,
      "comment_count": 0,
      "creator_steamid": "0",
      "last_update_steamid": "0",
      "event_notes": "see announcement body",
      "jsondata": "",
      "announcement_body": {
        "gid": String(release.id),
        "clanid": steamClanID,
        "posterid": "0",
        "headline": `Bazzite ${release.tag_name}`,
        "posttime": releasePublishedAt,
        "updatetime": releasePublishedAt,
        "body": bbcode.toString(),
        "commentcount": 0,
        "tags": [
          "patchnotes",
          (await isBazziteBranchTesting()) ? SteamOSChannel.Beta : SteamOSChannel.Stable,
        ],
        "language": 0,
        "hidden": 0,
        "forum_topic_id": "0",
        "event_gid": "0",
        "voteupcount": 0,
        "votedowncount": 0,
        "ban_check_result": 0,
        "banned": 0
      },
      "published": 1,
      "hidden": 0,
      "rtime32_visibility_start": 0,
      "rtime32_visibility_end": 0,
      "broadcaster_accountid": 0,
      "follower_count": 0,
      "ignore_count": 0,
      "forum_topic_id": "0",
      "rtime32_last_modified": releasePublishedAt,
      "news_post_gid": "0",
      "rtime_mod_reviewed": 0,
      "featured_app_tagid": 0,
      "referenced_appids": [],
      "build_id": 0,
      "build_branch": "",
      "unlisted": 0,
      "votes_up": 0,
      "votes_down": 0,
      "comment_type": "ForumTopic",
      "gidfeature": "0",
      "gidfeature2": "0"
    };

    // InternalLoadAdjacentPartnerEvents minified code, maps announcement and add it to cache
    if (!module.m_mapExistingEvents.has(event.gid)) {
      let steamId = new SteamID(event.clan_steamid);
      module.InsertEventModelFromClanEventData(steamId, event)
    }

    ret.push(module.m_mapExistingEvents.get(event.gid));
  }

  return ret;
}

async function fetchMoreReleases(count: number) {
  const releases = [];

  if (!generator && cachedGithubReleases.length === 0)
    generator = fetchReleases();

  let iterator;

  do {
    iterator = await generator.next();
    const release = iterator.value;
    releases.push(release);
  } while (releases.length < count && !iterator.done)

  for (const release of releases) {
    cachedGithubReleases.push({gid: String(release.id), release});
  }
}
