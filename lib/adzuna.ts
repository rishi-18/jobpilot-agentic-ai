export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1";
  contract_type?: string;
  created: string;
  category: { tag: string; label: string };
};

export function detectCountry(location: string): string {
  const locLower = location.toLowerCase();
  if (
    locLower.includes("london") ||
    locLower.includes("uk") ||
    locLower.includes("united kingdom") ||
    locLower.includes("great britain") ||
    locLower.includes("gb")
  ) {
    return "gb";
  }
  if (
    locLower.includes("canada") ||
    locLower.includes("ca") ||
    locLower.includes("toronto") ||
    locLower.includes("vancouver") ||
    locLower.includes("montreal")
  ) {
    return "ca";
  }
  if (
    locLower.includes("australia") ||
    locLower.includes("au") ||
    locLower.includes("sydney") ||
    locLower.includes("melbourne") ||
    locLower.includes("brisbane")
  ) {
    return "au";
  }
  return "us";
}

export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us"
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY || process.env.ADZUNA_API_KEY;

  if (!appId || !appKey) {
    console.error("[adzuna] Missing app_id or app_key environment variables.");
    return [];
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided and is not a generic "remote" string
  const trimmedLoc = location.trim();
  let cleanLoc = trimmedLoc;
  if (cleanLoc.toLowerCase() === "remote") {
    cleanLoc = "";
  } else {
    // If it is "Remote, New York", extract "New York"
    cleanLoc = cleanLoc.replace(/remote,?\s*/i, "").trim();
  }

  if (cleanLoc) {
    params.set("where", cleanLoc);
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
  console.log("[adzuna] calling URL:", url.replace(appKey, "REDACTED"));

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[adzuna] API returned status ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("[adzuna] fetch failed:", error);
    return [];
  }
}
