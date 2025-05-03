import {callable} from "@decky/api";

const getBazziteBranch = callable<[], string>("get_bazzite_branch");

export async function isBazziteBranchTesting() {
  const branch = await getBazziteBranch();
  return branch === "testing";
}

export async function* fetchReleases(signal?: AbortSignal) {
  const branch = await getBazziteBranch();
  const testing = branch === "stable";
  let currentPage = 1;
  let done = false;

  while (!done) {
    let response: Response;
    let responseJson: any;

    try {
      response = await fetch(
        `https://api.github.com/repos/ublue-os/bazzite/releases?page=${currentPage++}&per_page=10`,
        { signal });

      if (response.ok) {
        responseJson = await response.json();
      } else {
        responseJson = [];
      }
    } catch {
      responseJson = [];
    }

    if (!Array.isArray(responseJson) || responseJson.length == 0) {
      done = true;
    } else {
      responseJson.sort((a, b) => (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime());

      for (let release of responseJson) {
        if (release && ((testing && release.prerelease) || (!testing && !release.prerelease)))
          yield release;
      }
    }
  }

  return undefined;
}
