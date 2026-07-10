from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Betrieb, Kontaktversuch

router = APIRouter()


class BetriebPatch(BaseModel):
    email: Optional[str] = None
    optout: Optional[bool] = None
    status: Optional[str] = None


def _betrieb_to_dict(b: Betrieb, include_kontaktversuche: bool = False) -> dict:
    d = {
        "place_id": b.place_id,
        "name": b.name,
        "name_anzeige": b.name_anzeige,
        "adresse": b.adresse,
        "plz": b.plz,
        "ort": b.ort,
        "kanton": b.kanton,
        "telefon": b.telefon,
        "email": b.email,
        "website_url": b.website_url,
        "website_domain": b.website_domain,
        "keine_website": b.keine_website,
        "google_rating": float(b.google_rating) if b.google_rating else None,
        "google_anzahl": b.google_anzahl,
        "branche": b.branche,
        "status": b.status,
        "inhaber_name": b.inhaber_name,
        "farbe_primary": b.farbe_primary,
        "hat_logo": b.hat_logo,
        "logo_url": b.logo_url,
        "firmenprofil": b.firmenprofil,
        "slug": b.slug,
        "landing_url": b.landing_url,
        "outreach_status": b.outreach_status,
        "email_status": b.email_status,
        "optout": b.optout,
        "fehler_log": b.fehler_log,
        "entdeckt_am": b.entdeckt_am.isoformat() if b.entdeckt_am else None,
        "extrahiert_am": b.extrahiert_am.isoformat() if b.extrahiert_am else None,
        "landing_generiert_am": b.landing_generiert_am.isoformat() if b.landing_generiert_am else None,
        "letzter_kontakt_am": b.letzter_kontakt_am.isoformat() if b.letzter_kontakt_am else None,
    }
    if include_kontaktversuche and b.kontaktversuche is not None:
        d["kontaktversuche"] = [
            {
                "id": k.id,
                "typ": k.typ,
                "email_adresse": k.email_adresse,
                "email_subject": k.email_subject,
                "gesendet_am": k.gesendet_am.isoformat() if k.gesendet_am else None,
            }
            for k in b.kontaktversuche
        ]
    return d


@router.get("")
async def list_betriebe(
    status: Optional[str] = None,
    branche: Optional[str] = None,
    kanton: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Betrieb)
    if status:
        query = query.where(Betrieb.status == status)
    if branche:
        query = query.where(Betrieb.branche == branche)
    if kanton:
        query = query.where(Betrieb.kanton == kanton)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.offset(offset).limit(limit).order_by(Betrieb.entdeckt_am.desc())
    result = await db.execute(query)
    betriebe = result.scalars().all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [_betrieb_to_dict(b) for b in betriebe],
    }


@router.get("/{place_id}")
async def get_betrieb(place_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Betrieb)
        .where(Betrieb.place_id == place_id)
        .options(selectinload(Betrieb.kontaktversuche))
    )
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    return _betrieb_to_dict(b, include_kontaktversuche=True)


@router.patch("/{place_id}")
async def patch_betrieb(place_id: str, patch: BetriebPatch, db: AsyncSession = Depends(get_db)):
    b = await db.get(Betrieb, place_id)
    if not b:
        raise HTTPException(status_code=404, detail="Betrieb nicht gefunden")
    if patch.email is not None:
        b.email = patch.email
    if patch.optout is not None:
        b.optout = patch.optout
    if patch.status is not None:
        b.status = patch.status
    await db.commit()
    return _betrieb_to_dict(b)
