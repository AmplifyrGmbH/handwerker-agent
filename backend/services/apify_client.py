import asyncio
from concurrent.futures import ThreadPoolExecutor
from apify_client import ApifyClient
from config import settings

ACTOR_ID = "compass~crawler-google-places"

DEUTSCHSCHWEIZER_KANTONE = [
    "Zürich", "Bern", "Luzern", "Uri", "Schwyz",
    "Obwalden", "Nidwalden", "Glarus", "Zug", "Solothurn",
    "Basel-Stadt", "Basel-Landschaft", "Schaffhausen",
    "Appenzell Ausserrhoden", "Appenzell Innerrhoden",
    "St. Gallen", "Thurgau", "Aargau",
]

_executor = ThreadPoolExecutor(max_workers=1)


def get_search_queries(branche: str, orte_filter: str = "") -> tuple[list[str], list[str]]:
    """Returns (queries, location_queries). location_queries is non-empty only for specific orte."""
    if orte_filter:
        orte = [o.strip() for o in orte_filter.split(",") if o.strip()]
        queries = [branche] * len(orte)
        locations = [f"{ort}, Schweiz" for ort in orte]
        return queries, locations
    queries = [f"{branche} {kanton} Schweiz" for kanton in DEUTSCHSCHWEIZER_KANTONE]
    return queries, []


def _run_scraper_sync(queries: list[str], max_per_search: int, location_queries: list[str]) -> list[dict]:
    client = ApifyClient(settings.APIFY_API_TOKEN)
    all_items: list[dict] = []

    if location_queries:
        # Spezifische Orte: pro Ort einen gezielten Run (kein countryCode → kein Schweiz-Sweep)
        for query, location in zip(queries, location_queries):
            run = client.actor(ACTOR_ID).call(
                run_input={
                    "searchStringsArray": [query],
                    "locationQuery": location,
                    "maxCrawledPlacesPerSearch": max_per_search,
                    "language": "de",
                    "maxReviews": 5,
                    "reviewsSort": "newest",
                    "includeWebResults": False,
                }
            )
            dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else run.default_dataset_id
            all_items.extend(client.dataset(dataset_id).iterate_items())
    else:
        # Kanton-weite Suche: countryCode: ch für vollständige Abdeckung
        run = client.actor(ACTOR_ID).call(
            run_input={
                "searchStringsArray": queries,
                "maxCrawledPlacesPerSearch": max_per_search,
                "language": "de",
                "maxReviews": 5,
                "reviewsSort": "newest",
                "includeWebResults": False,
                "countryCode": "ch",
            }
        )
        dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else run.default_dataset_id
        all_items.extend(client.dataset(dataset_id).iterate_items())

    return all_items


async def run_scraper(queries: list[str], max_per_search: int, location_queries: list[str] = []) -> list[dict]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _run_scraper_sync, queries, max_per_search, location_queries)
