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


def get_search_queries(branche: str, kanton_filter: str = "") -> list[str]:
    if kanton_filter:
        return [f"{branche} {kanton_filter} Schweiz"]
    return [f"{branche} {kanton} Schweiz" for kanton in DEUTSCHSCHWEIZER_KANTONE]


def _run_scraper_sync(queries: list[str], max_per_search: int) -> list[dict]:
    client = ApifyClient(settings.APIFY_API_TOKEN)
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
    dataset_id = run["defaultDatasetId"]
    items = list(client.dataset(dataset_id).iterate_items())
    return items


async def run_scraper(queries: list[str], max_per_search: int) -> list[dict]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _run_scraper_sync, queries, max_per_search)
