import { findModuleExport } from "@decky/ui";
import { afterPatch } from "decky-frontend-lib";
import remarkHtml from "remark-html"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import {unified} from "unified"
import html2bbcode from "./html2bbcode";
import {Mutex} from 'async-mutex';

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
const githubReleasesURI = "https://api.github.com/repos/ublue-os/bazzite/releases";

enum SteamEventType {
  SmallUpdate = 12,
  Update = 13,
  BigUpdate = 14,
}

const mutex = new Mutex();
let releases: any[];
let channel: string;

export function patchPartnerEventStore() {
  return afterPatch(
    PartnerEventStore.prototype,
    "InternalLoadAdjacentPartnerEvents",
    async function(args, ret) {
      let [, , , appId, , , c, ] = args;

      if (appId !== steamOSAppId) {
        return ret;
      }

      ret = await Promise.resolve(ret);

      if (!Array.isArray(ret)) {
        return ret;
      }

      ret.length = 0;

      await mutex.runExclusive(async () => {
        if (releases && releases.length > 0)
          return;

        let response: Response;
        let responseJson: any;

        try {
          response = await fetch(githubReleasesURI);

          if (!response.ok)
            return;
  
          responseJson = await response.json();
        }
        catch {
          responseJson = [];
        }

        if (!Array.isArray(responseJson) || responseJson.length == 0) {
          return;
        }

        responseJson.sort((a, b) => (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime());

        if (c?.require_tags && c?.require_tags?.includes("stablechannel")) {
          releases = responseJson.filter(r => !r.prerelease);
          channel = "stablechannel";
        } else if (c?.require_tags && (c?.require_tags?.includes("betachannel") || c?.require_tags?.includes("previewchannel"))) {
          releases = responseJson.filter(r => r.prerelease);
          channel = "betachannel";
        } else {
          releases = responseJson;
          channel = "stablechannel";
        }
      });
      
      if (!releases || releases.length == 0)
        return ret;

      for (const release of releases) {
        const releaseCreatedAt = Math.floor((new Date(release.created_at)).getTime() / 1000);
        
        const html = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkHtml)
          .process(release.body);

        const converter = new (html2bbcode.HTML2BBCode)();
        const bbcode = converter.feed(html.value);

        // @ts-ignore
        const event = {
          "gid": String(release.id),
          "clan_steamid": steamClanSteamID,
          "event_name": release.name,
          "event_type": SteamEventType.Update,
          "appid": steamOSAppId,
          "server_address": "",
          "server_password": "",
          "rtime32_start_time": releaseCreatedAt,  // only used for certain event_type, not used for updates, but anyway
          "rtime32_end_time": releaseCreatedAt, // only used for certain event_type, not used for updates, but anyway
          "comment_count": 0,
          "creator_steamid": "0",
          "last_update_steamid": "0",
          "event_notes": "see announcement body",
          "jsondata": "{\n\t\"localized_subtitle\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_summary\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_title_image\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_capsule_image\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"bSaleEnabled\": false,\n\t\"sale_show_creator\": false,\n\t\"sale_sections\": [\n\n\t]\n\t,\n\t\"sale_browsemore_text\": \"\",\n\t\"sale_browsemore_url\": \"\",\n\t\"sale_browsemore_color\": \"\",\n\t\"sale_browsemore_bgcolor\": \"\",\n\t\"localized_sale_header\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_sale_overlay\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_sale_product_banner\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_sale_product_mobile_banner\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_sale_logo\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"sale_font\": \"\",\n\t\"sale_background_color\": \"\",\n\t\"sale_header_offset\": 150,\n\t\"referenced_appids\": [\n\n\t]\n\t,\n\t\"bBroadcastEnabled\": false,\n\t\"broadcastChatSetting\": \"hide\",\n\t\"default_broadcast_title\": \"#Broadcast_default_title_dev\",\n\t\"localized_broadcast_title\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_broadcast_left_image\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"localized_broadcast_right_image\": [\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull,\n\t\tnull\n\t]\n\t,\n\t\"broadcast_whitelist\": [\n\n\t]\n\t,\n\t\"bScheduleEnabled\": false,\n\t\"scheduleEntries\": [\n\n\t]\n\t,\n\t\"valve_access_log\": [\n\t\t{\n\t\t\t\"strSteamID\": \"76561197979253178\",\n\t\t\t\"rtUpdated\": 1741648377\n\t\t},\n\t\t{\n\t\t\t\"strSteamID\": \"76561198840299494\",\n\t\t\t\"rtUpdated\": 1741740761\n\t\t}\n\t]\n\t,\n\t\"clone_from_event_gid\": \"519706073503894980\",\n\t\"clone_from_sale_enabled\": false,\n\t\"automatically_push_updated_source\": true\n}",
          "announcement_body": {
              "gid": String(release.id),
              "clanid": steamClanID,
              "posterid": "0",
              "headline": `Bazzite ${release.name}`,
              "posttime": releaseCreatedAt,
              "updatetime": releaseCreatedAt,
              "body": bbcode.toString(),
              "commentcount": 0,
              "tags": [
                  "patchnotes",
                  channel,
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
          "rtime32_last_modified": releaseCreatedAt,
          "news_post_gid": "0",
          "rtime_mod_reviewed": 0,
          "featured_app_tagid": 0,
          "referenced_appids": [],
          "build_id": 0,
          "build_branch": "",
          "unlisted": 0,
          "votes_up": 0,
          "votes_down": 0,
          "comment_type": "ForumTopic", // haven't found a way to hide likes and comments
          "gidfeature": "0",
          "gidfeature2": "0"
        };

        // @ts-ignore
        if (!this.m_mapExistingEvents.has(event.gid)) {
          let steamId = new SteamID(event.clan_steamid);

          // @ts-ignore
          this.InsertEventModelFromClanEventData(steamId, event)
        }
        
        // @ts-ignore
        ret.push(this.m_mapExistingEvents.get(event.gid));
      }

      return ret;
    }
  );
}
